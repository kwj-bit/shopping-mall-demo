const Cart = require('../models/Cart');
const Product = require('../models/Product');

// 장바구니 문서를 응답용 형태로 가공하는 헬퍼
function formatCart(cart) {
  if (!cart) return null;
  return {
    id: cart._id,
    user: cart.user,
    status: cart.status,
    note: cart.note,
    metadata: cart.metadata,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
    total: cart.calculateTotal(),
    items: cart.items.map((item) => {
      const itemId = item._id ? item._id.toString() : undefined;
      return {
        id: itemId,
        _id: itemId,
        product: item.product,
        quantity: item.quantity,
        price: item.price,
        options: item.options,
        addedAt: item.addedAt
      };
    })
  };
}

// 상품이 실제 존재하는지 확인하는 헬퍼
async function ensureProduct(productId) {
  const product = await Product.findById(productId);
  if (!product) {
    const error = new Error('존재하지 않는 상품입니다.');
    error.statusCode = 404;
    throw error;
  }
  return product;
}

// 특정 사용자의 장바구니 조회
exports.getCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ user: userId }).populate('items.product');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      data: formatCart(cart)
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusMessage || '장바구니 정보를 가져오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 장바구니가 없으면 생성하고, 있으면 그대로 반환
exports.createOrGetCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const existing = await Cart.findOne({ user: userId });

    if (existing) {
      return res.status(200).json({
        success: true,
        message: '기존 장바구니가 존재합니다.',
        data: formatCart(existing)
      });
    }

    const cart = await Cart.create({
      user: userId,
      items: [],
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: '장바구니가 생성되었습니다.',
      data: formatCart(cart)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니를 생성하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 장바구니에 상품 추가(이미 있으면 수량/정보 업데이트)
exports.addItem = async (req, res) => {
  try {
    const { userId } = req.params;
    const { productId, quantity = 1, price, options } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: '상품 ID는 필수입니다.'
      });
    }

    const product = await ensureProduct(productId);

    const cart = await Cart.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, status: 'active' } },
      { upsert: true, new: true }
    );

    const existingItem = cart.items.find((item) => item.product.toString() === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
      if (price !== undefined) {
        existingItem.price = price;
      }
      if (options) {
        existingItem.options = options;
      }
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        price: price ?? product.price,
        options
      });
    }

    await cart.save();
    await cart.populate('items.product');

    res.status(200).json({
      success: true,
      message: '상품이 장바구니에 추가되었습니다.',
      data: formatCart(cart)
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusMessage || '장바구니에 상품을 추가하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 장바구니 아이템 수량/가격/옵션 수정
exports.updateItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;
    const { quantity, price, options } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.'
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니 상품을 찾을 수 없습니다.'
      });
    }

    if (quantity !== undefined) {
      if (quantity < 1) {
        return res.status(400).json({
          success: false,
          message: '수량은 1 이상이어야 합니다.'
        });
      }
      item.quantity = quantity;
    }

    if (price !== undefined) {
      if (price < 0) {
        return res.status(400).json({
          success: false,
          message: '가격은 0 이상이어야 합니다.'
        });
      }
      item.price = price;
    }

    if (options !== undefined) {
      item.options = options;
    }

    await cart.save();
    await cart.populate('items.product');

    res.json({
      success: true,
      message: '장바구니 상품이 수정되었습니다.',
      data: formatCart(cart)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니 상품을 수정하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 장바구니에서 특정 아이템 삭제
exports.removeItem = async (req, res) => {
  try {
    const { userId, itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.'
      });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: '장바구니 상품을 찾을 수 없습니다.'
      });
    }

    cart.items.pull({ _id: itemId });
    await cart.save();
    await cart.populate('items.product');

    res.json({
      success: true,
      message: '장바구니 상품이 삭제되었습니다.',
      data: formatCart(cart)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니 상품을 삭제하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 장바구니를 완전히 비우기
exports.clearCart = async (req, res) => {
  try {
    const { userId } = req.params;
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.'
      });
    }

    cart.items = [];
    await cart.save();

    res.json({
      success: true,
      message: '장바구니가 비워졌습니다.',
      data: formatCart(cart)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니를 비우는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 장바구니 상태/메모/메타데이터 업데이트
exports.updateStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, note, metadata } = req.body;

    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: '장바구니를 찾을 수 없습니다.'
      });
    }

    if (status) {
      cart.status = status;
    }
    if (note !== undefined) {
      cart.note = note;
    }
    if (metadata !== undefined) {
      cart.metadata = metadata;
    }

    await cart.save();

    res.json({
      success: true,
      message: '장바구니 정보가 업데이트되었습니다.',
      data: formatCart(cart)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '장바구니 정보를 업데이트하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

