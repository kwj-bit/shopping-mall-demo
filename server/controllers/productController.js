const Product = require('../models/Product');

// 상품 전체 조회
exports.getProducts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const [total, products] = await Promise.all([
      Product.countDocuments(),
      Product.find().sort({ name: 1 }).skip(skip).limit(limit)
    ]);

    res.json({
      success: true,
      count: products.length,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품 목록을 가져오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 상품 단건 조회
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품을 조회하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 상품 생성
exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      message: '상품이 성공적으로 등록되었습니다.',
      data: product
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '이미 존재하는 상품 ID입니다.'
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '입력값이 올바르지 않습니다.',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: '상품을 등록하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 상품 수정 (전체 업데이트)
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    Object.assign(product, req.body);
    await product.save();

    res.json({
      success: true,
      message: '상품이 성공적으로 수정되었습니다.',
      data: product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '입력값이 올바르지 않습니다.',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: '상품을 수정하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 상품 일부 수정
exports.patchProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '상품 정보가 성공적으로 수정되었습니다.',
      data: product
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: '입력값이 올바르지 않습니다.',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: '상품을 수정하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 상품 삭제
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '상품이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '상품을 삭제하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};



