const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// POST /auth/login - User login
router.post('/login', userController.login);

// GET /auth/me - Get current user info from token
router.get('/me', userController.me);

module.exports = router;


