const puppeteer = require('puppeteer');

/**
 * Helper function to wait for a specified amount of time
 */
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Debug helper to log page HTML
 */
async function debugPageHTML(page, orderId, context = '') {
  try {
    const html = await page.evaluate(() => {
      // Get a simplified version of the body text
      const bodyText = document.body.innerText.substring(0, 500);
      // Get button/link text
      const buttons = Array.from(document.querySelectorAll('button, a')).map(
        (el) => el.textContent?.trim().substring(0, 30),
      );
      return {
        bodyText,
        buttons: buttons.slice(0, 20), // First 20 buttons/links
        url: window.location.href,
      };
    });
    console.log(
      `[${orderId}] 🔍 DEBUG ${context}:`,
      JSON.stringify(html, null, 2),
    );
  } catch (error) {
    console.log(`[${orderId}] Could not debug HTML: ${error.message}`);
  }
}

/**
 * Debug the DOM structure
 */
async function debugDOM(page, sessionId, context = '') {
  try {
    const domInfo = await page.evaluate(() => {
      // Get all textareas
      const textareas = Array.from(document.querySelectorAll('textarea'));

      // Get all contenteditable elements
      const contentEditables = Array.from(
        document.querySelectorAll('[contenteditable="true"]'),
      );

      // Get all inputs
      const inputs = Array.from(
        document.querySelectorAll('input[type="text"]'),
      );

      return {
        textareas: textareas.map((el, i) => ({
          index: i,
          placeholder: el.placeholder,
          ariaLabel: el.getAttribute('aria-label'),
          value: el.value,
          name: el.name,
          id: el.id,
          visible: el.offsetParent !== null,
        })),
        contentEditables: contentEditables.map((el, i) => ({
          index: i,
          role: el.getAttribute('role'),
          ariaLabel: el.getAttribute('aria-label'),
          text: el.textContent?.substring(0, 50),
          visible: el.offsetParent !== null,
        })),
        inputs: inputs.map((el, i) => ({
          index: i,
          placeholder: el.placeholder,
          ariaLabel: el.getAttribute('aria-label'),
          value: el.value,
          visible: el.offsetParent !== null,
        })),
      };
    });

    console.log(
      `[${sessionId}] 🔍 DOM ${context}:`,
      JSON.stringify(domInfo, null, 2),
    );
  } catch (error) {
    console.log(`[${sessionId}] Could not debug DOM: ${error.message}`);
  }
}

/**
 * Initiates Facebook Marketplace lowball automation
 * @param {Object} options - Automation options
 * @param {string} options.sessionId - Unique session identifier
 * @param {string} options.searchItem - Item to search for on Marketplace
 * @param {number} options.numPeople - Number of people to lowball (default: 3, max: 10)
 * @returns {Promise<Object>} Session object
 */
async function lowballMarketplace({ sessionId, searchItem, numPeople = 3 }) {
  // Enforce limits
  const peopleToLowball = Math.min(Math.max(1, numPeople), 100);

  console.log(`[${sessionId}] Launching browser...`);
  console.log(`[${sessionId}] Search item: "${searchItem}"`);
  console.log(`[${sessionId}] Target: ${peopleToLowball} people`);

  // Launch browser with persistent session
  const browser = await puppeteer.launch({
    headless: process.env.BROWSER_HEADLESS !== 'false',
    userDataDir: './puppeteer-data-facebook',
    args: [
      '--window-size=1200,900',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
    ],
    defaultViewport: {
      width: 1200,
      height: 900,
    },
  });

  const page = await browser.newPage();

  // Set user agent
  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  );

  const session = {
    sessionId,
    browser,
    page,
    status: 'pending',
    startTime: Date.now(),
    searchItem,
    numPeople: peopleToLowball,
    lowballedCount: 0,
  };

  try {
    // Navigate to Facebook
    console.log(`[${sessionId}] Navigating to Facebook...`);
    await page.goto('https://www.facebook.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    await wait(200);
    await debugPageHTML(page, sessionId, 'After Facebook load');

    // Check if logged in
    console.log(`[${sessionId}] Checking login status...`);
    const isLoggedIn = await checkLoginStatus(page);

    if (!isLoggedIn) {
      console.log(
        `[${sessionId}] ⚠️  Not logged in - please log into Facebook in the browser window`,
      );
      console.log(`[${sessionId}] ⏳ Waiting up to 90 seconds for login...`);

      // Wait for user to log in
      const maxAttempts = 30;
      let attempts = 0;
      let loggedIn = false;

      while (attempts < maxAttempts && !loggedIn) {
        await wait(3000);
        loggedIn = await checkLoginStatus(page);
        attempts++;

        if (loggedIn) {
          console.log(`[${sessionId}] ✓ User logged in successfully!`);
          break;
        } else if (attempts % 5 === 0) {
          const elapsed = attempts * 3;
          console.log(
            `[${sessionId}] ⏳ Still waiting for login... (${elapsed}s elapsed)`,
          );
        }
      }

      if (!loggedIn) {
        const error = new Error(
          'Login timeout - user did not log into Facebook within 90 seconds',
        );
        error.code = 'NOT_AUTHENTICATED';
        throw error;
      }
    } else {
      console.log(`[${sessionId}] ✓ User is already logged in`);
    }

    // Navigate to Marketplace
    await navigateToMarketplace(page, sessionId);

    // Search for item
    await searchForItem(page, searchItem, sessionId);

    // Get listings
    const listings = await getListings(page, sessionId);
    console.log(`[${sessionId}] Found ${listings.length} listings`);

    if (listings.length === 0) {
      throw new Error(
        'No listings found for this search. Try a different search term.',
      );
    }

    // Lowball sellers
    await lowballSellers(page, session, listings);

    console.log(
      `[${sessionId}] ✅ Completed lowballing ${session.lowballedCount} sellers`,
    );
    session.status = 'completed';

    // Keep browser open for review
    console.log(
      `[${sessionId}] Keeping browser open for 30 seconds for review...`,
    );
    await wait(30000);
    await browser.close();
  } catch (error) {
    console.error(`[${sessionId}] Error during automation:`, error.message);
    session.status = 'failed';
    await browser.close();
    throw error;
  }

  return session;
}

/**
 * Check if user is logged into Facebook
 */
async function checkLoginStatus(page) {
  try {
    await wait(200);

    const isLoggedIn = await page.evaluate(() => {
      const bodyText = document.body.innerText;

      // Method 1: Check for typical logged-in indicators
      if (
        bodyText.includes('Home') &&
        (bodyText.includes('Marketplace') ||
          bodyText.includes('Notifications') ||
          bodyText.includes('Messages'))
      ) {
        return { loggedIn: true, method: 'navigation-menu' };
      }

      // Method 2: Check for navigation bar with profile
      const navSelectors = [
        '[aria-label="Your profile"]',
        '[aria-label="Account"]',
        '[data-click="profile_icon"]',
        'a[href*="/me/"]',
      ];

      for (const selector of navSelectors) {
        if (document.querySelector(selector)) {
          return { loggedIn: true, method: 'profile-icon' };
        }
      }

      // Method 3: Look for Marketplace link (only visible when logged in)
      const marketplaceLink = document.querySelector('a[href*="/marketplace"]');
      if (marketplaceLink) {
        return { loggedIn: true, method: 'marketplace-link' };
      }

      // Method 4: Logged OUT indicators
      if (
        bodyText.includes('Log In') ||
        bodyText.includes('Sign Up') ||
        bodyText.includes('Create New Account')
      ) {
        return { loggedIn: false, method: 'login-prompts' };
      }

      return { loggedIn: false, method: 'no-indicators' };
    });

    return isLoggedIn.loggedIn;
  } catch (error) {
    return false;
  }
}

/**
 * Navigate to Facebook Marketplace
 */
async function navigateToMarketplace(page, sessionId) {
  try {
    console.log(`[${sessionId}] Navigating to Marketplace...`);

    // Try to find and click Marketplace link
    const marketplaceUrl = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const marketplaceLink = links.find(
        (link) =>
          link.href.includes('/marketplace') ||
          link.textContent?.trim() === 'Marketplace',
      );
      return marketplaceLink ? marketplaceLink.href : null;
    });

    if (marketplaceUrl) {
      console.log(`[${sessionId}] Found Marketplace link: ${marketplaceUrl}`);
      await page.goto(marketplaceUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    } else {
      // Fallback: direct navigation
      console.log(`[${sessionId}] Using direct navigation to Marketplace`);
      await page.goto('https://www.facebook.com/marketplace', {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
    }

    await wait(300);
    await debugPageHTML(page, sessionId, 'After Marketplace navigation');

    console.log(`[${sessionId}] ✓ Marketplace loaded`);
  } catch (error) {
    throw new Error(`Failed to navigate to Marketplace: ${error.message}`);
  }
}

/**
 * Search for an item on Marketplace
 */
async function searchForItem(page, searchItem, sessionId) {
  try {
    console.log(`[${sessionId}] Searching for: "${searchItem}"`);

    // Navigate to marketplace search page directly with query
    const searchUrl = `https://www.facebook.com/marketplace/category/search/?query=${encodeURIComponent(searchItem)}`;
    console.log(`[${sessionId}] Navigating to: ${searchUrl}`);

    await page.goto(searchUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    // Wait for search results to load
    console.log(`[${sessionId}] Waiting for search results...`);
    await wait(600);

    await debugPageHTML(page, sessionId, 'After search');

    console.log(`[${sessionId}] ✓ Search completed`);
  } catch (error) {
    throw new Error(`Failed to search for item: ${error.message}`);
  }
}

/**
 * Get marketplace listings
 */
async function getListings(page, sessionId) {
  try {
    console.log(`[${sessionId}] Collecting listings...`);

    // Scroll to load more listings - ULTRA FAST
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await wait(200);
    }

    await debugPageHTML(page, sessionId, 'After scrolling');

    // Extract listing links - much more targeted approach
    const listings = await page.evaluate(() => {
      const results = [];

      // Strategy 1: Find all marketplace item links
      const allLinks = Array.from(
        document.querySelectorAll('a[href*="/marketplace/item/"]'),
      );

      for (const link of allLinks) {
        const href = link.href;

        // Skip if it has unwanted patterns
        if (
          href.includes('/create') ||
          href.includes('/category') ||
          href.includes('ref=notif') || // Notification links
          href.includes('notif_id=') ||
          href.includes('notif_t=')
        ) {
          continue;
        }

        // Skip if it's in the notification sidebar
        const inSidebar = link.closest('[role="complementary"]');
        if (inSidebar) {
          continue;
        }

        // Skip if the link or any parent contains "Unread"
        let element = link;
        let isUnread = false;
        for (let i = 0; i < 5; i++) {
          if (!element) break;
          if (
            element.textContent?.includes('Unread') ||
            element.getAttribute('aria-label')?.includes('Unread')
          ) {
            isUnread = true;
            break;
          }
          element = element.parentElement;
        }
        if (isUnread) {
          continue;
        }

        // Try to get title from nearby span tags or image alt
        let title = 'Unknown';

        // Method 1: Check image alt text
        const img = link.querySelector('img');
        if (
          img &&
          img.alt &&
          img.alt !== 'Image may contain: ' &&
          img.alt.length > 2
        ) {
          title = img.alt;
        }

        // Method 2: Look for span with actual text near the link
        if (title === 'Unknown') {
          const parent = link.closest(
            'div[role="group"], div[class*="item"], div[class*="card"]',
          );
          if (parent) {
            const spans = parent.querySelectorAll('span');
            for (const span of spans) {
              const text = span.textContent?.trim();
              // Look for text that's not a price and has reasonable length
              if (
                text &&
                text.length > 3 &&
                text.length < 100 &&
                !text.startsWith('$') &&
                !text.includes('·')
              ) {
                title = text;
                break;
              }
            }
          }
        }

        results.push({
          url: href.split('?')[0], // Clean URL
          text: title.substring(0, 80),
        });
      }

      // Remove duplicates
      const unique = [];
      const seen = new Set();
      for (const item of results) {
        if (!seen.has(item.url)) {
          seen.add(item.url);
          unique.push(item);
        }
      }

      return unique;
    });

    console.log(`[${sessionId}] Found ${listings.length} unique listings`);
    console.log(`[${sessionId}] Sample listings:`);
    listings.slice(0, 5).forEach((l, i) => {
      console.log(`  ${i + 1}. ${l.text}`);
      console.log(`     URL: ${l.url}`);
    });

    return listings;
  } catch (error) {
    throw new Error(`Failed to get listings: ${error.message}`);
  }
}

/**
 * Lowball sellers
 */
async function lowballSellers(page, session, listings) {
  const { sessionId, numPeople } = session;

  console.log(
    `[${sessionId}] Starting to lowball sellers (target: ${numPeople})...`,
  );

  // Keep trying listings until we've successfully sent numPeople messages
  let listingIndex = 0;

  while (session.lowballedCount < numPeople && listingIndex < listings.length) {
    const listing = listings[listingIndex];

    try {
      console.log(
        `[${sessionId}] Processing listing ${listingIndex + 1}/${listings.length}: ${listing.text}`,
      );
      console.log(
        `[${sessionId}] Progress: ${session.lowballedCount}/${numPeople} messages sent`,
      );

      // Navigate to listing
      await page.goto(listing.url, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
      await wait(1500);

      await debugPageHTML(page, sessionId, `Listing ${listingIndex + 1}`);

      // Check if we've already messaged this seller
      const alreadyMessaged = await page.evaluate(() => {
        const textareas = Array.from(document.querySelectorAll('textarea'));
        return textareas.length === 0;
      });

      if (alreadyMessaged) {
        console.log(
          `[${sessionId}] ⏭️  Already messaged this seller, skipping to next listing...`,
        );
        listingIndex++;
        continue;
      }

      // Get the price from the listing
      const price = await page.evaluate(() => {
        // Look for price elements
        const priceRegex = /\$[\d,]+/;
        const bodyText = document.body.innerText;
        const match = bodyText.match(priceRegex);
        return match ? match[0] : null;
      });

      console.log(`[${sessionId}] Detected price: ${price || 'unknown'}`);

      // Check DOM to see what's available
      await debugDOM(page, sessionId, `On listing page before typing`);

      // Calculate lowball offer (20% of price = 80% off)
      let lowballOffer = 'a lower price';
      if (price) {
        const priceNum = parseInt(price.replace(/[$,]/g, ''));
        if (!isNaN(priceNum)) {
          const lowballNum = Math.floor(priceNum * 0.2);
          lowballOffer = `$${lowballNum}`;
        }
      }

      // Type lowball message (friendly version)
      const message = `Hey! I'm really interested in this! Would you be willing to accept ${lowballOffer}? Let me know, thanks! 😊`;
      console.log(`[${sessionId}] Typing message: "${message}"`);

      let messageTyped = { success: false };

      try {
        // Find textareas and focus the visible one
        const foundTextarea = await page.evaluate(() => {
          const textareas = Array.from(document.querySelectorAll('textarea'));

          if (textareas.length === 0) {
            return { found: false };
          }

          // Find and focus the visible one
          const visibleTextarea = textareas.find(
            (el) => el.offsetParent !== null,
          );
          if (visibleTextarea) {
            visibleTextarea.focus();
            visibleTextarea.click();
            return { found: true, count: textareas.length };
          }

          return { found: false };
        });

        if (foundTextarea.found) {
          console.log(
            `[${sessionId}] ✓ Found ${foundTextarea.count} textareas, focused visible one`,
          );

          // Wait for focus
          await wait(300);

          // CRITICAL: Must type character-by-character to trigger React's onChange handlers
          // React controlled inputs don't respond to direct DOM manipulation
          console.log(
            `[${sessionId}] Selecting all text with keyboard shortcut...`,
          );

          // Use keyboard shortcut to select all (Cmd+A on Mac, Ctrl+A on Windows)
          const isMac = process.platform === 'darwin';
          const modifierKey = isMac ? 'Meta' : 'Control';
          await page.keyboard.down(modifierKey);
          await page.keyboard.press('KeyA');
          await page.keyboard.up(modifierKey);
          await wait(100);

          // Type the custom message character-by-character
          // This triggers React's onChange handler for each keystroke, updating React state
          console.log(
            `[${sessionId}] Typing custom message character-by-character...`,
          );
          await page.keyboard.type(message, { delay: 20 }); // 20ms per character = ~50 chars/sec

          await wait(500);

          // Verify the message is in ALL textareas
          const messageInInput = await page.evaluate((expectedMsg) => {
            const textareas = Array.from(document.querySelectorAll('textarea'));

            // Check if ALL textareas have the custom message
            const allMatch = textareas.every(
              (textarea) => textarea.value === expectedMsg,
            );

            const visibleTextarea = textareas.find(
              (el) => el.offsetParent !== null,
            );

            if (visibleTextarea && visibleTextarea.value) {
              return {
                found: true,
                allTextareasMatch: allMatch,
                textareaCount: textareas.length,
                length: visibleTextarea.value.length,
                preview: visibleTextarea.value.substring(0, 60),
                matches: visibleTextarea.value === expectedMsg,
              };
            }

            return { found: false };
          }, message);

          if (messageInInput.found && messageInInput.matches) {
            console.log(
              `[${sessionId}] ✓ Custom message verified in input (${messageInInput.length} chars)`,
            );
            console.log(
              `[${sessionId}]   Preview: "${messageInInput.preview}..."`,
            );
            if (messageInInput.allTextareasMatch) {
              console.log(
                `[${sessionId}] ✓ ALL ${messageInInput.textareaCount} textareas updated successfully`,
              );
            } else {
              console.log(
                `[${sessionId}] ⚠️  WARNING: Not all textareas match! This may cause issues.`,
              );
            }
            messageTyped = { success: true };
          } else if (messageInInput.found) {
            console.log(
              `[${sessionId}] ⚠️  Message in input but doesn't match: "${messageInInput.preview}"`,
            );
            messageTyped = { success: false };
          } else {
            console.log(
              `[${sessionId}] ⚠️  No message found in input after typing!`,
            );
            messageTyped = { success: false };
          }
        } else {
          console.log(`[${sessionId}] ⚠️  Could not find visible textarea`);
          await debugDOM(page, sessionId, `Textarea not found`);
        }
      } catch (error) {
        console.log(`[${sessionId}] Error typing: ${error.message}`);
        messageTyped = { success: false };
      }

      if (messageTyped.success) {
        // Instead of clicking Send automatically, wait for USER to send
        console.log(`[${sessionId}] ✅ Message ready to send!`);
        console.log(`[${sessionId}] 👆 PLEASE CLICK THE SEND BUTTON NOW...`);

        // Wait for user to click Send (textarea will be cleared when sent)
        console.log(
          `[${sessionId}] ⏳ Waiting up to 30 seconds for you to send the message...`,
        );

        let messageSent = false;
        let attempts = 0;
        const maxAttempts = 60; // 60 attempts * 500ms = 30 seconds

        while (attempts < maxAttempts && !messageSent) {
          await wait(500);

          const checkSent = await page.evaluate(() => {
            const textareas = Array.from(document.querySelectorAll('textarea'));
            const visibleTextarea = textareas.find(
              (el) => el.offsetParent !== null,
            );

            // Message is sent when textarea is cleared
            if (visibleTextarea && visibleTextarea.value === '') {
              return { sent: true };
            }
            return { sent: false };
          });

          if (checkSent.sent) {
            messageSent = true;
            console.log(`[${sessionId}] ✅ Message sent successfully!`);
            session.lowballedCount++;
            break;
          }

          attempts++;

          // Progress indicator every 5 seconds
          if (attempts % 10 === 0) {
            const elapsed = attempts * 0.5;
            console.log(
              `[${sessionId}] ⏳ Still waiting... (${elapsed}s elapsed)`,
            );
          }
        }

        if (!messageSent) {
          console.log(`[${sessionId}] ⚠️  Timeout - moving to next listing`);
        }

        // Close message dialog if still open
        await page.keyboard.press('Escape');
        await wait(300);
      } else {
        console.log(
          `[${sessionId}] ⚠️  Could not type message for listing ${listingIndex + 1}, skipping...`,
        );
        await debugDOM(page, sessionId, `Failed to type message`);
      }

      // Small delay between listings
      await wait(300);

      // Move to next listing
      listingIndex++;
    } catch (error) {
      console.log(
        `[${sessionId}] Error processing listing ${listingIndex + 1}: ${error.message}`,
      );
      listingIndex++;
      continue;
    }
  }

  if (session.lowballedCount < numPeople) {
    console.log(
      `[${sessionId}] ⚠️  Only sent ${session.lowballedCount}/${numPeople} messages (ran out of new listings)`,
    );
  } else {
    console.log(
      `[${sessionId}] ✓ Successfully sent ${session.lowballedCount} lowball message(s)`,
    );
  }
  console.log(
    `[${sessionId}] 📊 Processed ${listingIndex} listing(s) to send ${session.lowballedCount} message(s)`,
  );
}

/**
 * Cancel the automation session
 */
async function cancelSession(session) {
  const { sessionId, browser, status } = session;

  if (status === 'completed') {
    console.log(`[${sessionId}] Session already completed`);
    return;
  }

  console.log(`[${sessionId}] ❌ Cancelling session...`);

  try {
    if (browser && typeof browser.close === 'function') {
      await browser.close();
      console.log(`[${sessionId}] ✓ Browser closed`);
    } else {
      console.log(`[${sessionId}] Browser already closed or not available`);
    }
  } catch (error) {
    console.error(`[${sessionId}] Error closing browser:`, error.message);
  }

  session.status = 'cancelled';
  console.log(`[${sessionId}] ✓ Session cancelled`);
}

module.exports = {
  lowballMarketplace,
  cancelSession,
};
