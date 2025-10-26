/**
 * Default configuration values for the beer automation system
 */

module.exports = {
  // Server configuration
  server: {
    port: process.env.PORT || 3000,
    host: 'localhost'
  },

  // DoorDash defaults
  doordash: {
    defaultAddress: process.env.DOORDASH_DEFAULT_ADDRESS || '123 Main St, Berkeley, CA 94704',
    url: 'https://www.doordash.com'
  },

  // Browser configuration
  browser: {
    headless: process.env.BROWSER_HEADLESS === 'true',
    slowMo: 50,
    defaultViewport: {
      width: 1200,
      height: 900
    }
  },

  // Order defaults
  order: {
    cancelWindowSeconds: parseInt(process.env.CANCEL_WINDOW_SECONDS || '10', 10),
    defaultBeerType: 'Any',
    defaultQuantity: 6,
    maxQuantity: 12
  },

  // Timeouts (in milliseconds)
  timeouts: {
    pageLoad: 30000,
    navigation: 5000,
    elementWait: 5000
  }
};
