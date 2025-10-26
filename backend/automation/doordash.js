const puppeteer = require('puppeteer');

/**
 * Helper function to wait for a specified amount of time
 * (replaces deprecated page.waitForTimeout)
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Initiates a beer order on DoorDash
 * @param {Object} options - Order options
 * @param {string} options.orderId - Unique order identifier
 * @param {string} options.deliveryAddress - Delivery address
 * @param {string} options.scheduleTime - When to deliver ('now' or ISO timestamp)
 * @param {string} options.beerPreference - Type of beer to order
 * @param {number} options.quantity - Number of items to order
 * @returns {Promise<Object>} Order session object
 */
async function orderBeer({
  orderId,
  deliveryAddress,
  scheduleTime,
  beerPreference,
  quantity,
}) {
  console.log(`[${orderId}] Launching browser...`);

  // Launch browser (visible for debugging, headless for production)
  const browser = await puppeteer.launch({
    headless: process.env.BROWSER_HEADLESS !== 'false',
    slowMo: 50, // Slow down for visibility
    // Use a persistent user data directory to save login sessions
    userDataDir: './puppeteer-data',
    args: [
      '--window-size=1200,900',
      '--disable-blink-features=AutomationControlled', // Hide automation
      '--no-sandbox',
    ],
    defaultViewport: {
      width: 1200,
      height: 900,
    },
  });

  const page = await browser.newPage();

  // Set user agent to avoid detection
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );

  const orderSession = {
    orderId,
    browser,
    page,
    status: 'pending',
    startTime: Date.now(),
    cancelTimer: null,
    deliveryAddress,
    beerPreference,
    quantity,

    getTimeRemaining() {
      const elapsed = Date.now() - this.startTime;
      return Math.max(0, 10 - Math.floor(elapsed / 1000));
    },
  };

  try {
    // Navigate to DoorDash
    console.log(`[${orderId}] Navigating to DoorDash...`);
    await page.goto('https://www.doordash.com', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    // Wait for page to load
    await wait(2000);

    // Check if logged in and wait if not
    console.log(`[${orderId}] Checking login status...`);
    const isLoggedIn = await checkLoginStatus(page);

    if (!isLoggedIn) {
      console.log(
        `[${orderId}] ⚠️  Not logged in - please log into DoorDash in the browser window`,
      );
      console.log(`[${orderId}] ⏳ Waiting up to 90 seconds for login...`);

      // Wait for user to log in (check every 3 seconds for up to 90 seconds)
      const maxAttempts = 30;
      let attempts = 0;
      let loggedIn = false;

      while (attempts < maxAttempts && !loggedIn) {
        await wait(3000);
        loggedIn = await checkLoginStatus(page);
        attempts++;

        if (loggedIn) {
          console.log(`[${orderId}] ✓ User logged in successfully!`);
          break;
        } else if (attempts % 5 === 0) {
          // Progress update every 15 seconds
          const elapsed = attempts * 3;
          console.log(
            `[${orderId}] ⏳ Still waiting for login... (${elapsed}s elapsed)`,
          );
        }
      }

      if (!loggedIn) {
        const error = new Error(
          'Login timeout - user did not log into DoorDash within 90 seconds',
        );
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }
    } else {
      console.log(`[${orderId}] ✓ User is already logged in`);
    }

    // Update delivery address (only if provided)
    if (deliveryAddress) {
      console.log(`[${orderId}] Setting delivery address: ${deliveryAddress}`);
      await setDeliveryAddress(page, deliveryAddress, orderId);
    } else {
      console.log(`[${orderId}] Using saved DoorDash delivery address`);
    }

    // Clear cart if there are items from previous orders
    await clearCart(page, orderId);

    // Navigate to Alcohol section (more reliable than searching)
    console.log(`[${orderId}] Navigating to Alcohol section...`);
    const alcoholPageUrl = await navigateToAlcohol(page, orderId);

    // Try multiple stores until we successfully add items to cart
    const maxStoreAttempts = 5;
    let storeAttempt = 0;
    let itemsAdded = false;

    while (storeAttempt < maxStoreAttempts && !itemsAdded) {
      storeAttempt++;
      console.log(
        `[${orderId}] Store attempt ${storeAttempt}/${maxStoreAttempts}...`,
      );

      try {
        // Select a liquor store
        await selectLiquorStore(page, orderId, storeAttempt);

        // Try to add items to cart
        console.log(`[${orderId}] Adding items to cart...`);
        await addItemsToCart(page, beerPreference, quantity, orderId);

        itemsAdded = true;
        console.log(`[${orderId}] ✓ Successfully added items to cart!`);
      } catch (error) {
        console.log(
          `[${orderId}] Store ${storeAttempt} failed: ${error.message}`,
        );

        if (storeAttempt < maxStoreAttempts) {
          console.log(`[${orderId}] Going back to try another store...`);
          // Navigate back to the alcohol section page
          await page.goto(alcoholPageUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000,
          });
          await wait(2000);
        } else {
          throw new Error(
            `Failed to add items after trying ${maxStoreAttempts} stores`,
          );
        }
      }
    }

    // Set up 10-second cancellation timer
    console.log(`[${orderId}] ⏱️  10-second cancellation window started...`);
    orderSession.cancelTimer = setTimeout(async () => {
      if (orderSession.status === 'pending') {
        console.log(
          `[${orderId}] Cancellation window expired - completing order...`,
        );
        await completeOrder(orderSession);
      }
    }, 10000);

    return orderSession;
  } catch (error) {
    console.error(
      `[${orderId}] Error during order initialization:`,
      error.message,
    );
    await browser.close();
    throw error;
  }
}

/**
 * Clear the cart if there are items
 */
async function clearCart(page, orderId) {
  try {
    // Check if there are items in cart
    const cartCount = await page.evaluate(() => {
      const cartButton = document.querySelector(
        '[data-testid="OrderCartIconButton"]',
      );
      const text = cartButton?.textContent || '';
      const match = text.match(/(\d+)\s*items?/);
      return match ? parseInt(match[1]) : 0;
    });

    if (cartCount === 0) {
      console.log(`[${orderId}] Cart is already empty`);
      return;
    }

    console.log(`[${orderId}] Clearing ${cartCount} items from cart...`);

    // Click cart button
    const cartButton = await page.$('[data-testid="OrderCartIconButton"]');
    if (cartButton) {
      await cartButton.click();
      await wait(3000);

      // Look for and click "Clear cart" or delete buttons
      // First try to find a "clear all" type button
      const cleared = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));

        // Priority 1: Look for specific "clear all" or "delete saved cart" buttons
        const clearAllButton = buttons.find((btn) => {
          const text = btn.textContent?.toLowerCase() || '';
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';

          return (
            text.includes('clear cart') ||
            text.includes('clear all') ||
            text.includes('empty cart') ||
            text.includes('remove all') ||
            ariaLabel.includes('clear cart') ||
            ariaLabel.includes('clear all') ||
            ariaLabel.includes('empty cart') ||
            ariaLabel.includes('remove all') ||
            ariaLabel.includes('delete saved cart')
          );
        });

        if (clearAllButton) {
          clearAllButton.click();
          return { clicked: true, type: 'clear_all' };
        }

        // Priority 2: Delete items one by one
        const deleteButtons = buttons.filter((btn) => {
          const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
          const text = btn.textContent?.toLowerCase() || '';

          return (
            (ariaLabel.includes('delete') || ariaLabel.includes('remove')) &&
            !ariaLabel.includes('saved cart') &&
            (text === '' || text.includes('delete') || text.includes('remove'))
          );
        });

        return { clicked: false, type: 'none', deleteCount: deleteButtons.length };
      });

      if (cleared.clicked && cleared.type === 'clear_all') {
        console.log(`[${orderId}] Clicked "clear all" button, waiting for confirmation...`);
        await wait(1500);

        // Handle potential confirmation dialog
        const confirmed = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const confirmButton = buttons.find((btn) => {
            const text = btn.textContent?.toLowerCase() || '';
            const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';

            return (
              text.includes('confirm') ||
              text.includes('delete') ||
              text.includes('yes') ||
              text.includes('remove') ||
              ariaLabel.includes('confirm') ||
              ariaLabel.includes('delete') ||
              ariaLabel.includes('yes')
            );
          });
          if (confirmButton) {
            confirmButton.click();
            return true;
          }
          return false;
        });

        if (confirmed) {
          console.log(`[${orderId}] ✓ Confirmed cart deletion`);
          await wait(1000);
        }

        console.log(`[${orderId}] ✓ Cart cleared`);
      } else if (cleared.deleteCount > 0) {
        // Delete items one by one
        console.log(`[${orderId}] No "clear all" button found, deleting ${cleared.deleteCount} items individually...`);

        for (let i = 0; i < cleared.deleteCount; i++) {
          const deleted = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const deleteButton = buttons.find((btn) => {
              const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
              const text = btn.textContent?.toLowerCase() || '';

              return (
                (ariaLabel.includes('delete') || ariaLabel.includes('remove')) &&
                !ariaLabel.includes('saved cart') &&
                (text === '' || text.includes('delete') || text.includes('remove'))
              );
            });

            if (deleteButton) {
              deleteButton.click();
              return true;
            }
            return false;
          });

          if (deleted) {
            console.log(`[${orderId}] ✓ Deleted item ${i + 1}/${cleared.deleteCount}`);
            await wait(800);
          } else {
            console.log(`[${orderId}] Could not find delete button for item ${i + 1}`);
            break;
          }
        }

        console.log(`[${orderId}] ✓ All items deleted from cart`);
      } else {
        console.log(`[${orderId}] Could not find clear button - skipping cart clear`);
      }

      // Close cart
      await page.keyboard.press('Escape');
      await wait(1000);
    }
  } catch (error) {
    console.log(
      `[${orderId}] Note: Could not clear cart (${error.message}) - continuing anyway`,
    );
  }
}

/**
 * Check if user is logged into DoorDash
 */
async function checkLoginStatus(page) {
  try {
    await wait(1000);

    try {
      const isLoggedIn = await page.evaluate(() => {
        const bodyText = document.body.innerText;

        // Method 1: Check for "Welcome back!" - strong indicator of being logged in
        if (bodyText.includes('Welcome back!')) {
          return { loggedIn: true, method: 'welcome-back-text' };
        }

        // Method 2: Check for notification bell (only visible when logged in)
        const notificationBell = document.querySelector(
          '[data-testid="NotificationBell"], [data-testid="HeaderNotificationBellIcon"]',
        );
        if (notificationBell) {
          return { loggedIn: true, method: 'notification-bell' };
        }

        // Method 3: Check for both "Account" AND "Orders" in sidebar (indicates logged in)
        const hasAccount = bodyText.includes('Account');
        const hasOrders = bodyText.includes('Orders');
        if (
          hasAccount &&
          hasOrders &&
          !bodyText.includes('Sign In') &&
          !bodyText.includes('Sign Up')
        ) {
          return { loggedIn: true, method: 'account-and-orders' };
        }

        // Method 4: Check for account button/menu
        const accountSelectors = [
          '[data-testid="AccountButton"]',
          '[data-testid="account-menu"]',
          'button[aria-label*="Account"]',
          'a[href*="/account"]',
          '[data-anchor-id="AccountLink"]',
          '[data-testid="UserAccount"]',
          'button[data-anchor-id*="Account"]',
          'div[data-testid*="account"]',
          // More generic selectors
          'button[class*="account" i]',
          'button[class*="user" i]',
          'div[class*="UserMenu" i]',
        ];

        for (const selector of accountSelectors) {
          const element = document.querySelector(selector);
          if (element) {
            return { loggedIn: true, method: 'selector', selector };
          }
        }

        // Method 5: Explicit logout indicators
        if (
          bodyText.includes('My Account') ||
          bodyText.includes('Sign Out') ||
          bodyText.includes('Log Out')
        ) {
          return { loggedIn: true, method: 'text-account' };
        }

        // Method 6: Logged OUT indicators - must have Sign In/Up AND no Account section
        if (bodyText.includes('Sign In') || bodyText.includes('Sign Up')) {
          // But only if there's no account/profile section
          const hasAccountSection =
            bodyText.includes('Account') ||
            bodyText.includes('Profile') ||
            bodyText.includes('Orders');
          if (!hasAccountSection) {
            return { loggedIn: false, method: 'text-signIn' };
          }
        }

        // Method 7: Check for delivery address being set (usually only visible when logged in)
        const addressInput = document.querySelector(
          'input[placeholder*="address" i], input[name*="address" i]',
        );
        if (addressInput && addressInput.value) {
          return { loggedIn: true, method: 'address-set' };
        }

        return { loggedIn: false, method: 'no-indicators' };
      });

      return isLoggedIn.loggedIn;
    } catch (err) {
      if (err.message.includes('Execution context was destroyed')) {
        return false;
      }
      throw err;
    }
  } catch (error) {
    if (error.message.includes('Execution context was destroyed')) {
      return false;
    }
    return false;
  }
}

/**
 * Set delivery address
 */
async function setDeliveryAddress(page, address, orderId) {
  try {
    // Wait for address input to be available
    const addressSelectors = [
      'input[data-testid="AddressInput"]',
      'input[placeholder*="address"]',
      'input[name="address"]',
      '#FieldWrapper-0', // Common DoorDash address input
    ];

    let addressInput = null;
    for (const selector of addressSelectors) {
      addressInput = await page.$(selector);
      if (addressInput) {
        console.log(
          `[${orderId}] Found address input with selector: ${selector}`,
        );
        break;
      }
    }

    if (!addressInput) {
      console.warn(
        `[${orderId}] Could not find address input - using default/saved address`,
      );
      return;
    }

    // Click the input
    await addressInput.click();
    await wait(500);

    // Clear existing text
    await addressInput.click({ clickCount: 3 });
    await page.keyboard.press('Backspace');

    // Type new address
    await addressInput.type(address, { delay: 50 });
    await wait(1000);

    // Press Enter or click first suggestion
    await page.keyboard.press('Enter');
    await wait(2000);

    console.log(`[${orderId}] ✓ Address set successfully`);
  } catch (error) {
    console.warn(
      `[${orderId}] Address setting failed - proceeding with saved address:`,
      error.message,
    );
  }
}

/**
 * Navigate to Alcohol section
 * @returns {Promise<string>} The URL of the alcohol page
 */
async function navigateToAlcohol(page, orderId) {
  try {
    // Look for the Alcohol link in the sidebar and get its URL
    const alcoholUrl = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const alcoholLink = links.find(
        (link) =>
          link.textContent.trim() === 'Alcohol' &&
          link.href.includes('vertical_homepage'),
      );
      return alcoholLink ? alcoholLink.href : null;
    });

    if (!alcoholUrl) {
      throw new Error('Could not find Alcohol link in sidebar');
    }

    console.log(`[${orderId}] Navigating to Alcohol section: ${alcoholUrl}`);

    // Navigate to the alcohol page
    await page.goto(alcoholUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for page to load
    await wait(3000);

    // Wait for store cards to appear
    try {
      await page.waitForSelector('a[href*="/store/"]', { timeout: 10000 });
      console.log(`[${orderId}] ✓ Alcohol section loaded`);
    } catch (err) {
      console.log(
        `[${orderId}] Warning: Store cards might not have loaded yet`,
      );
      // Continue anyway, we'll handle this in selectLiquorStore
    }

    return alcoholUrl;
  } catch (error) {
    throw new Error(`Navigation to Alcohol section failed: ${error.message}`);
  }
}

/**
 * Select available liquor store by index
 */
async function selectLiquorStore(page, orderId, storeIndex = 1) {
  try {
    // Find all store links - filter to only actual stores, not search pages
    const storeLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links
        .filter((link) => {
          const href = link.href || '';
          // Only include actual store pages, not search results
          return (
            href.includes('/store/') &&
            !href.includes('/search/store/') &&
            !href.includes('/browse/') &&
            !href.includes('/categories/')
          );
        })
        .map((link, idx) => ({
          index: idx,
          href: link.href?.substring(0, 100),
          text: link.textContent?.trim().substring(0, 50),
        }));
    });

    console.log(
      `[${orderId}] Found ${storeLinks.length} actual stores on the page`,
    );

    if (storeLinks.length === 0) {
      throw new Error('No liquor stores found in your area');
    }

    // Select store by index (1-based, so subtract 1 for 0-based array)
    const targetIndex = storeIndex - 1;
    if (targetIndex >= storeLinks.length) {
      throw new Error(
        `Only ${storeLinks.length} stores available, cannot select store ${storeIndex}`,
      );
    }

    console.log(
      `[${orderId}] Selecting store ${storeIndex}: ${storeLinks[targetIndex].href}`,
    );

    // Navigate directly to the store URL instead of clicking
    const storeUrl = storeLinks[targetIndex].href;
    await page.goto(storeUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for page to load
    await wait(3000);

    // Verify we're on a store page
    const currentUrl = page.url();
    if (!currentUrl.includes('/store/')) {
      throw new Error(
        `Failed to navigate to store - ended up on: ${currentUrl}`,
      );
    }

    console.log(`[${orderId}] ✓ Store ${storeIndex} selected`);
  } catch (error) {
    throw new Error(`Store selection failed: ${error.message}`);
  }
}

/**
 * Add items to cart
 */
async function addItemsToCart(page, beerPreference, quantity, orderId) {
  try {
    await wait(2000);

    // Search for beer in the store
    const storeSearch = await page.$('input[placeholder*="Search"]');
    if (storeSearch) {
      // Always search for beer to filter out non-beer items
      const searchTerm =
        beerPreference && beerPreference !== 'Any'
          ? `${beerPreference} beer 6 pack`
          : 'beer 6 pack';
      console.log(`[${orderId}] Searching for: ${searchTerm}`);
      await storeSearch.type(searchTerm, { delay: 100 });
      await page.keyboard.press('Enter');
      await wait(3000);
    } else {
      console.log(
        `[${orderId}] No search box found, browsing all products...`,
      );
    }

    // After search, find and click "Add" buttons directly
    // The search results show products with "Add" buttons, not product links
    const addButtons = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));

      // Find all "Add" buttons
      const addBtns = buttons.filter((btn) => {
        const text = btn.textContent?.trim() || '';
        const ariaLabel = btn.getAttribute('aria-label') || '';

        return (
          text === 'Add' ||
          text.startsWith('Add ') ||
          ariaLabel.includes('Add to cart') ||
          ariaLabel.includes('Add to order')
        );
      });

      return addBtns.length;
    });

    console.log(`[${orderId}] Found ${addButtons} Add buttons on page`);

    if (addButtons === 0) {
      throw new Error(
        'No Add buttons found - this store might not have the searched items',
      );
    }

    // Click up to 2 "Add" buttons
    const itemsToAdd = Math.min(quantity, 2, addButtons); // Limit to 2 items for demo
    let itemsAdded = 0;

    for (let i = 0; i < itemsToAdd; i++) {
      console.log(`[${orderId}] Clicking Add button ${i + 1}...`);

      // Click the i-th Add button
      const clicked = await page.evaluate((index) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addBtns = buttons.filter((btn) => {
          const text = btn.textContent?.trim() || '';
          const ariaLabel = btn.getAttribute('aria-label') || '';

          return (
            text === 'Add' ||
            text.startsWith('Add ') ||
            ariaLabel.includes('Add to cart') ||
            ariaLabel.includes('Add to order')
          );
        });

        if (addBtns[index]) {
          // Get product name from nearby text
          let productName = 'Unknown';
          const parent = addBtns[index].closest('[class*="item"], [class*="product"], [class*="card"]');
          if (parent) {
            productName = parent.textContent?.trim().substring(0, 50) || 'Unknown';
          }

          addBtns[index].click();
          return productName;
        }
        return null;
      }, i);

      if (clicked) {
        itemsAdded++;
        console.log(`[${orderId}] ✓ Added item ${itemsAdded}: ${clicked}`);
        await wait(1500);
      } else {
        console.warn(`[${orderId}] Could not click Add button ${i + 1}`);
      }
    }

    if (itemsAdded === 0) {
      throw new Error('Failed to add any items to cart');
    }

    console.log(`[${orderId}] ✓ Added ${itemsAdded} items to cart`);
  } catch (error) {
    throw new Error(`Failed to add items to cart: ${error.message}`);
  }
}

/**
 * Complete the order (checkout)
 */
async function completeOrder(orderSession) {
  const { page, browser, orderId } = orderSession;

  try {
    console.log(`[${orderId}] 🍺 Completing order...`);
    orderSession.status = 'completing';

    // Go to cart
    const cartSelectors = [
      '[data-testid="CartButton"]',
      '[data-testid="cart-button"]',
      'button[aria-label*="Cart"]',
      '[class*="CartButton"]',
    ];

    let cartButton = null;
    for (const selector of cartSelectors) {
      cartButton = await page.$(selector);
      if (cartButton) break;
    }

    if (cartButton) {
      await cartButton.click();
      await wait(2000);
    }

    // Click checkout
    const checkoutSelectors = [
      '[data-testid="CheckoutButton"]',
      '[class*="CheckoutButton"]',
    ];

    let checkoutButton = null;
    for (const selector of checkoutSelectors) {
      checkoutButton = await page.$(selector);
      if (checkoutButton) break;
    }

    // If no button found by selector, search by text content
    if (!checkoutButton) {
      checkoutButton = await page.evaluateHandle(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.find(
          (btn) =>
            btn.textContent.includes('Checkout') ||
            btn.textContent.includes('Go to Checkout'),
        );
      });
      if (checkoutButton && (await checkoutButton.asElement())) {
        checkoutButton = await checkoutButton.asElement();
      } else {
        checkoutButton = null;
      }
    }

    if (checkoutButton) {
      await checkoutButton.click();
      await wait(3000);
    }

    // NOTE: We stop here before actually placing the order to avoid real charges
    // In production with user consent, you would click the final "Place Order" button

    console.log(
      `[${orderId}] ✅ Order ready for checkout (stopped before final placement)`,
    );
    console.log(
      `[${orderId}] ⚠️  In demo mode - not actually placing order to avoid charges`,
    );

    orderSession.status = 'confirmed';

    // Keep browser open for 10 seconds to show the checkout page
    await wait(10000);
    await browser.close();
  } catch (error) {
    console.error(`[${orderId}] Error completing order:`, error);
    orderSession.status = 'failed';
    await browser.close();
  }
}

/**
 * Cancel an order
 */
async function cancelOrder(orderSession) {
  const { cancelTimer, browser, status, orderId } = orderSession;

  if (status !== 'pending') {
    throw new Error('Order cannot be cancelled - already completed or failed');
  }

  console.log(`[${orderId}] ❌ Cancelling order...`);

  // Clear the auto-complete timer
  if (cancelTimer) {
    clearTimeout(cancelTimer);
  }

  // Close browser
  try {
    await browser.close();
  } catch (error) {
    console.error(`[${orderId}] Error closing browser:`, error);
  }

  orderSession.status = 'cancelled';
  console.log(`[${orderId}] ✓ Order cancelled successfully`);
}

module.exports = {
  orderBeer,
  cancelOrder,
};
