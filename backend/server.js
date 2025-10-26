const express = require('express');
const cors = require('cors');
const { orderBeer, cancelOrder } = require('./automation/doordash');
const { lowballMarketplace, cancelSession } = require('./automation/facebook');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Store active orders in memory
const activeOrders = new Map();
const activeLowballSessions = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Automation server is running',
    activeOrders: activeOrders.size,
    activeLowballSessions: activeLowballSessions.size
  });
});

// Order beer endpoint
app.post('/api/order-beer', async (req, res) => {
  const { deliveryAddress, scheduleTime, beerPreference, quantity } = req.body;

  try {
    const orderId = Date.now().toString();

    console.log(`[${orderId}] Starting beer order...`);
    console.log(`  Address: ${deliveryAddress || 'Using saved DoorDash address'}`);
    console.log(`  Beer Type: ${beerPreference || 'Any'}`);
    console.log(`  Quantity: ${quantity || 6}`);

    // Start browser automation
    const orderSession = await orderBeer({
      orderId,
      deliveryAddress: deliveryAddress || null,
      scheduleTime: scheduleTime || 'now',
      beerPreference: beerPreference || 'Any',
      quantity: quantity || 6
    });

    // Store order session
    activeOrders.set(orderId, orderSession);

    // Auto-cleanup completed orders after 5 minutes
    setTimeout(() => {
      if (activeOrders.has(orderId)) {
        const session = activeOrders.get(orderId);
        if (session.status !== 'pending') {
          activeOrders.delete(orderId);
          console.log(`[${orderId}] Order cleaned up from memory`);
        }
      }
    }, 300000); // 5 minutes

    res.json({
      success: true,
      orderId,
      cancelWindowSeconds: 10,
      message: 'Order initiated. Cancel within 10 seconds.'
    });

  } catch (error) {
    console.error('Error initiating order:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      errorCode: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Cancel order endpoint
app.post('/api/cancel-order', async (req, res) => {
  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({
      success: false,
      error: 'Order ID is required'
    });
  }

  const orderSession = activeOrders.get(orderId);

  if (!orderSession) {
    return res.status(404).json({
      success: false,
      error: 'Order not found or already completed'
    });
  }

  try {
    console.log(`[${orderId}] Cancelling order...`);
    await cancelOrder(orderSession);
    activeOrders.delete(orderId);

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error(`[${orderId}] Error cancelling order:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get order status endpoint
app.get('/api/order-status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const orderSession = activeOrders.get(orderId);

  if (!orderSession) {
    return res.json({
      orderId,
      status: 'not_found',
      message: 'Order not found in active orders'
    });
  }

  res.json({
    orderId,
    status: orderSession.status,
    timeRemaining: orderSession.getTimeRemaining(),
    message: getStatusMessage(orderSession.status)
  });
});

// ============================================
// Facebook Marketplace Lowball Endpoints
// ============================================

// Start lowball automation endpoint
app.post('/api/lowball-marketplace', async (req, res) => {
  const { searchItem, numPeople } = req.body;

  if (!searchItem) {
    return res.status(400).json({
      success: false,
      error: 'searchItem is required'
    });
  }

  try {
    const sessionId = Date.now().toString();

    console.log(`[${sessionId}] Starting Facebook Marketplace lowball...`);
    console.log(`  Search: ${searchItem}`);
    console.log(`  Target: ${numPeople || 30} people`);

    // Start browser automation (don't await - run in background)
    lowballMarketplace({
      sessionId,
      searchItem,
      numPeople: numPeople || 30
    })
      .then((session) => {
        console.log(`[${sessionId}] Lowball session completed`);
        // Auto-cleanup after 5 minutes
        setTimeout(() => {
          if (activeLowballSessions.has(sessionId)) {
            activeLowballSessions.delete(sessionId);
            console.log(`[${sessionId}] Session cleaned up from memory`);
          }
        }, 300000);
      })
      .catch((error) => {
        console.error(`[${sessionId}] Lowball session failed:`, error);
      });

    // Store session info
    activeLowballSessions.set(sessionId, {
      sessionId,
      searchItem,
      numPeople: numPeople || 30,
      status: 'running',
      startTime: Date.now()
    });

    res.json({
      success: true,
      sessionId,
      searchItem,
      numPeople: numPeople || 30,
      message: 'Lowball automation started'
    });

  } catch (error) {
    console.error('Error starting lowball automation:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      errorCode: error.code || 'UNKNOWN_ERROR'
    });
  }
});

// Cancel lowball session endpoint
app.post('/api/cancel-lowball', async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({
      success: false,
      error: 'sessionId is required'
    });
  }

  const session = activeLowballSessions.get(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      error: 'Session not found or already completed'
    });
  }

  try {
    console.log(`[${sessionId}] Cancelling lowball session...`);
    await cancelSession(session);
    activeLowballSessions.delete(sessionId);

    res.json({
      success: true,
      message: 'Lowball session cancelled successfully'
    });
  } catch (error) {
    console.error(`[${sessionId}] Error cancelling session:`, error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get lowball session status endpoint
app.get('/api/lowball-status/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const session = activeLowballSessions.get(sessionId);

  if (!session) {
    return res.json({
      sessionId,
      status: 'not_found',
      message: 'Session not found in active sessions'
    });
  }

  res.json({
    sessionId,
    searchItem: session.searchItem,
    numPeople: session.numPeople,
    status: session.status,
    lowballedCount: session.lowballedCount || 0,
    message: getLowballStatusMessage(session.status)
  });
});

// Helper function to get lowball status message
function getLowballStatusMessage(status) {
  const messages = {
    running: 'Automation is currently running',
    completed: 'Automation completed successfully',
    cancelled: 'Automation was cancelled',
    failed: 'Automation failed - check logs for details'
  };
  return messages[status] || 'Unknown status';
}

// Helper function to get status message
function getStatusMessage(status) {
  const messages = {
    pending: 'Order is pending - waiting for cancellation window to expire',
    completing: 'Order is being completed - adding items to cart and checking out',
    confirmed: 'Order has been placed successfully',
    cancelled: 'Order was cancelled',
    failed: 'Order failed - check logs for details'
  };
  return messages[status] || 'Unknown status';
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('=================================================');
  console.log(`🤖 Automation server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log('=================================================');
  console.log('Available endpoints:');
  console.log(`  GET  /api/health`);
  console.log('');
  console.log('DoorDash Beer Ordering:');
  console.log(`  POST /api/order-beer`);
  console.log(`  POST /api/cancel-order`);
  console.log(`  GET  /api/order-status/:orderId`);
  console.log('');
  console.log('Facebook Marketplace Lowballing:');
  console.log(`  POST /api/lowball-marketplace`);
  console.log(`  POST /api/cancel-lowball`);
  console.log(`  GET  /api/lowball-status/:sessionId`);
  console.log('=================================================');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');

  // Cancel all active orders
  for (const [orderId, session] of activeOrders.entries()) {
    console.log(`Cleaning up order ${orderId}...`);
    cancelOrder(session).catch(console.error);
  }

  // Cancel all active lowball sessions
  for (const [sessionId, session] of activeLowballSessions.entries()) {
    console.log(`Cleaning up lowball session ${sessionId}...`);
    cancelSession(session).catch(console.error);
  }

  process.exit(0);
});
