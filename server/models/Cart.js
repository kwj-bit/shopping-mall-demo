const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId()
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, '상품 정보는 필수입니다.']
  },
  quantity: {
    type: Number,
    required: [true, '상품 수량은 필수입니다.'],
    min: [1, '상품 수량은 최소 1개 이상이어야 합니다.'],
    default: 1
  },
  price: {
    type: Number,
    required: [true, '상품 가격은 필수입니다.'],
    min: [0, '상품 가격은 0 이상이어야 합니다.']
  },
  options: {
    type: Map,
    of: String
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const CartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, '사용자 정보는 필수입니다.'],
    index: true
  },
  items: {
    type: [CartItemSchema],
    validate: [
      {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: '장바구니에는 최소 1개의 상품이 필요합니다.'
      }
    ]
  },
  status: {
    type: String,
    enum: ['active', 'saved', 'ordered'],
    default: 'active'
  },
  note: {
    type: String,
    trim: true,
    maxlength: [500, '메모는 최대 500자까지 입력 가능합니다.']
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

CartSchema.methods.calculateTotal = function calculateTotal() {
  return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

module.exports = mongoose.model('Cart', CartSchema);

