const mongoose = require('mongoose');

const { Schema } = mongoose;

const OrderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  product_snapshot: {
    name: String,
    sku: String,
    image: String,
    brand: String,
    category: String,
    description: String
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit_price: {
    type: Number,
    required: true,
    min: 0
  },
  total_price: {
    type: Number,
    required: true,
    min: 0
  },
  options: {
    type: Map,
    of: String
  },
  status: {
    type: String,
    enum: ['ready', 'shipped', 'cancelled', 'refunded'],
    default: 'ready'
  }
}, { _id: true });

const OrderSchema = new Schema({
  order_id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  cart: {
    type: Schema.Types.ObjectId,
    ref: 'Cart'
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    default: 'pending',
    index: true
  },
  status_history: [{
    status: {
      type: String,
      enum: ['pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    memo: String
  }],
  payment: {
    method: {
      type: String,
      enum: ['card', 'bank_transfer', 'virtual_account', 'mobile', 'cod', 'points', 'other'],
      default: 'card'
    },
    provider: String,
    transaction_id: String,
    merchant_uid: String,
    pg_tid: String,
    receipt_url: String,
    amount_paid: {
      type: Number,
      min: 0
    },
    currency: {
      type: String,
      default: 'KRW'
    },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'captured', 'failed', 'refunded'],
      default: 'pending'
    },
    paid_at: Date
  },
  sub_total: {
    type: Number,
    required: true,
    min: 0
  },
  shipping_fee: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discounts: [{
    type: {
      type: String
    },
    label: String,
    amount: {
      type: Number,
      min: 0
    }
  }],
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  shipping_address: {
    recipient_name: { type: String, required: true },
    recipient_phone: { type: String, required: true },
    postal_code: { type: String, required: true },
    address_line1: { type: String, required: true },
    address_line2: String,
    city: String,
    state: String,
    country: { type: String, default: 'KR' }
  },
  shipping_method: {
    type: String,
    default: 'standard'
  },
  shipping_status: {
    type: String,
    enum: ['pending', 'packed', 'shipped', 'delivered'],
    default: 'pending'
  },
  tracking_number: String,
  shipped_at: Date,
  delivered_at: Date,
  delivery_note: String,
  items: {
    type: [OrderItemSchema],
    validate: {
      validator: (value) => Array.isArray(value) && value.length > 0,
      message: '주문에는 최소 1개의 상품이 필요합니다.'
    },
    required: true
  },
  memo: String,
  admin_note: String,
  cancelled_at: Date,
  cancel_reason: String,
  refund: {
    amount: {
      type: Number,
      min: 0
    },
    reason: String,
    refunded_at: Date,
    transaction_id: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', OrderSchema);

