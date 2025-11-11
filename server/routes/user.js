const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /users - Get all users
router.get('/', userController.getAllUsers);

// GET /users/:id - Get a single user by ID
router.get('/:id', userController.getUserById);

// POST /users - Create a new user
router.post('/', userController.createUser);

// PUT /users/:id - Update a user
router.put('/:id', userController.updateUser);

// PATCH /users/:id - Partially update a user
router.patch('/:id', userController.partialUpdateUser);

// DELETE /users/:id - Delete a user
router.delete('/:id', userController.deleteUser);

module.exports = router;

