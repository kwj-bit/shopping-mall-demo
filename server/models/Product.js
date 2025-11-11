const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  product_id: {
    type: String,
    required: [true, '상품 ID는 필수입니다.'],
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: [true, '상품 이름은 필수입니다.'],
    trim: true,
    maxlength: [150, '상품 이름은 최대 150자까지 입력 가능합니다.']
  },
  price: {
    type: Number,
    required: [true, '상품 가격은 필수입니다.'],
    min: [0, '상품 가격은 0 이상이어야 합니다.']
  },
  category: {
    type: String,
    required: [true, '카테고리는 필수입니다.'],
    enum: ['스킨케어', '메이크업', '바디케어', '헤어케어']
  },
  image: {
    type: String,
    required: [true, '상품 이미지는 필수입니다.'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, '설명은 최대 2000자까지 입력 가능합니다.']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);



