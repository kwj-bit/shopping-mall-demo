const express = require('express');
const router = express.Router();

// Import route modules
const userRoutes = require('./user');
const authRoutes = require('./auth');
const productRoutes = require('./product');
const cartRoutes = require('./cart');
const orderRoutes = require('./order');

// API routes
router.get('/', (req, res) => {
  res.json({ 
    message: 'Shopping Mall Demo API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      users: '/users',
      authLogin: '/auth/login',
      authMe: '/auth/me',
      products: '/products',
      cart: '/cart/:userId',
      orders: '/orders'
    }
  });
});

router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Mount route modules
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);

module.exports = router;

