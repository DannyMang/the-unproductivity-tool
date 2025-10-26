const express = require('express');
const cors = require('cors');
const { orderBeer, cancelOrder, getOrderStatus } = require('./automation/doordash');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Store active orders in memory
const activeOrders = new Map();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Beer automation server is running',
    activeOrders: activeOrders.size
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
  console.log(`🍺 Beer automation server running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log('=================================================');
  console.log('Available endpoints:');
  console.log(`  GET  /api/health`);
  console.log(`  POST /api/order-beer`);
  console.log(`  POST /api/cancel-order`);
  console.log(`  GET  /api/order-status/:orderId`);
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

  process.exit(0);
});
