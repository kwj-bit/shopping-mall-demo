const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Required fields
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  user_type: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['customer', 'admin'],
    default: 'customer'
  },
  // Optional fields
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  }
}, {
  timestamps: true  // createdAt, updatedAt 자동 관리
});

const User = mongoose.model('User', UserSchema);

const Product = require('./Product');
const Cart = require('./Cart');
const Order = require('./Order');

module.exports = {
  User,
  Product,
  Cart,
  Order
};

