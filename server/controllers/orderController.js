const https = require('https');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

const IAMPORT_API_HOST = 'api.iamport.kr';

// 랜덤 주문번호를 생성하는 헬퍼 (외부 노출용)
function generateOrderId() {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
}

// 관리자 여부 확인
function isAdmin(user) {
  return user?.user_type === 'admin';
}

// 주문 접근 권한 확인 (본인 주문 또는 관리자)
function canAccessOrder(order, user) {
  if (!order || !user) return false;
  return isAdmin(user) || order.user.toString() === user._id.toString();
}

function requestIamport(path, { method = 'GET', headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const finalHeaders = { ...headers };

    if (payload) {
      if (!finalHeaders['Content-Type']) {
        finalHeaders['Content-Type'] = 'application/json';
      }
      if (!finalHeaders['Content-Length']) {
        finalHeaders['Content-Length'] = Buffer.byteLength(payload);
      }
    }

    const request = https.request({
      hostname: IAMPORT_API_HOST,
      path,
      method,
      headers: finalHeaders
    }, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ statusCode: response.statusCode, data: parsed });
        } catch (error) {
          error.statusCode = response.statusCode;
          reject(error);
        }
      });
    });

    request.on('error', reject);

    if (payload) {
      request.write(payload);
    }

    request.end();
  });
}

async function getIamportAccessToken() {
  const apiKey = process.env.IAMPORT_API_KEY;
  const apiSecret = process.env.IAMPORT_API_SECRET;

  if (!apiKey || !apiSecret) {
    const error = new Error('결제 검증을 위한 API 키가 설정되어 있지 않습니다.');
    error.statusCode = 500;
    throw error;
  }

  const { data } = await requestIamport('/users/getToken', {
    method: 'POST',
    body: {
      imp_key: apiKey,
      imp_secret: apiSecret
    }
  });

  if (!data || data.code !== 0 || !data.response?.access_token) {
    const error = new Error(data?.message || '포트원 인증 토큰을 가져오지 못했습니다.');
    error.statusCode = 502;
    error.response = data;
    throw error;
  }

  return data.response.access_token;
}

async function fetchIamportPayment(impUid, accessToken) {
  const { data } = await requestIamport(`/payments/${encodeURIComponent(impUid)}`, {
    method: 'GET',
    headers: {
      Authorization: accessToken
    }
  });

  if (!data || data.code !== 0 || !data.response) {
    const error = new Error(data?.message || '결제 정보를 가져오는 데 실패했습니다.');
    error.statusCode = 502;
    error.response = data;
    throw error;
  }

  return data.response;
}

function mapIamportStatusToPaymentStatus(status) {
  switch (status) {
    case 'paid':
      return 'captured';
    case 'ready':
      return 'authorized';
    case 'cancelled':
      return 'refunded';
    case 'failed':
      return 'failed';
    default:
      return 'pending';
  }
}

function mapIamportPayMethod(payMethod, fallback) {
  switch (payMethod) {
    case 'card':
      return 'card';
    case 'trans':
      return 'bank_transfer';
    case 'vbank':
      return 'virtual_account';
    case 'phone':
      return 'mobile';
    default:
      return fallback || 'other';
  }
}

function convertUnixTimestamp(seconds) {
  if (!seconds) return undefined;
  if (typeof seconds === 'number') {
    return new Date(seconds * 1000);
  }

  const numeric = Number(seconds);
  if (Number.isFinite(numeric) && numeric > 0) {
    return new Date(numeric * 1000);
  }

  const parsed = new Date(seconds);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

async function verifyIamportPayment({ impUid, merchantUid, amount }) {
  if (!impUid) {
    const error = new Error('결제 검증에 필요한 imp_uid가 전달되지 않았습니다.');
    error.statusCode = 400;
    throw error;
  }

  const accessToken = await getIamportAccessToken();
  const paymentData = await fetchIamportPayment(impUid, accessToken);

  if (merchantUid && paymentData.merchant_uid && merchantUid !== paymentData.merchant_uid) {
    const error = new Error('주문 번호가 결제 정보와 일치하지 않습니다.');
    error.statusCode = 400;
    throw error;
  }

  const expectedAmount = Number(amount);
  if (Number.isFinite(expectedAmount) && expectedAmount > 0) {
    const paidAmount = Number(paymentData.amount);
    if (!Number.isFinite(paidAmount) || Math.round(paidAmount) !== Math.round(expectedAmount)) {
      const error = new Error('결제 금액이 주문 금액과 일치하지 않습니다.');
      error.statusCode = 400;
      throw error;
    }
  }

  return paymentData;
}

async function clearCartItemsAfterOrder(cartId, cartItemIds, user) {
  if (!cartId) return;

  try {
    const cart = await Cart.findById(cartId);
    if (!cart) return;

    if (!user || (!isAdmin(user) && cart.user.toString() !== user._id.toString())) {
      return;
    }

    const targetIds = Array.isArray(cartItemIds)
      ? cartItemIds.map((id) => id && id.toString()).filter(Boolean)
      : [];

    if (!cart.items || cart.items.length === 0) {
      await Cart.findByIdAndDelete(cartId);
      return;
    }

    if (targetIds.length === 0) {
      await Cart.findByIdAndDelete(cartId);
      return;
    }

    const remainingItems = cart.items.filter((item) => !targetIds.includes(item._id.toString()));

    if (remainingItems.length === 0) {
      await Cart.findByIdAndDelete(cartId);
      return;
    }

    cart.items = remainingItems;
    cart.status = 'ordered';
    await cart.save();
  } catch (error) {
    console.error('장바구니 정리 중 오류가 발생했습니다.', error);
  }
}

function normalizeNumber(value, defaultValue = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : defaultValue;
}

function normalizeOrderStatusFromPayment(paymentStatus) {
  switch (paymentStatus) {
    case 'captured':
    case 'authorized':
      return 'paid';
    case 'failed':
    case 'refunded':
      return 'cancelled';
    default:
      return 'pending';
  }
}

// 주문 목록 조회
exports.getOrders = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const query = {};
    if (!isAdmin(req.user)) {
      query.user = req.user._id;
    } else if (req.query.userId) {
      query.user = req.query.userId;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const [total, orders] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate('user', 'name email')
        .populate('items.product', 'name price image')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ]);

    res.json({
      success: true,
      count: orders.length,
      total,
      page,
      limit,
      totalPages: Math.max(Math.ceil(total / limit), 1),
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '주문 목록을 가져오는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 주문 단건 조회
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: '해당 주문에 접근할 권한이 없습니다.'
      });
    }

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '주문을 조회하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 주문 생성
exports.createOrder = async (req, res) => {
  try {
    const payload = { ...req.body };
    const originalPayment = payload.payment ? { ...payload.payment } : {};
    const rawItems = Array.isArray(payload.items) ? payload.items : [];

    if (!rawItems.length) {
      return res.status(400).json({
        success: false,
        message: '주문에는 최소 1개의 상품이 필요합니다.'
      });
    }

    const cartItemIds = [];
    payload.items = rawItems.map((item) => {
      const copy = { ...item };
      if (item?.cart_item_id) {
        cartItemIds.push(item.cart_item_id);
      }
      return copy;
    });

    const candidateOrderId = payload.order_id || originalPayment.merchant_uid;
    if (candidateOrderId) {
      payload.order_id = candidateOrderId;
    }

    const duplicateConditions = [];
    if (payload.order_id) {
      duplicateConditions.push({ order_id: payload.order_id });
    }
    if (originalPayment.transaction_id) {
      duplicateConditions.push({ 'payment.transaction_id': originalPayment.transaction_id });
    }
    if (originalPayment.imp_uid) {
      duplicateConditions.push({ 'payment.transaction_id': originalPayment.imp_uid });
    }
    if (originalPayment.merchant_uid) {
      duplicateConditions.push({ 'payment.merchant_uid': originalPayment.merchant_uid });
    }

    if (duplicateConditions.length) {
      const existingOrder = await Order.findOne({ $or: duplicateConditions });
      if (existingOrder) {
        return res.status(409).json({
          success: false,
          message: '이미 동일한 주문이 처리되었습니다.',
          data: existingOrder
        });
      }
    }

    const normalizedSubTotal = normalizeNumber(payload.sub_total, 0);
    const normalizedShipping = normalizeNumber(payload.shipping_fee, 0);
    const normalizedTotalAmount = normalizeNumber(
      payload.total_amount,
      normalizedSubTotal + normalizedShipping
    );

    const impUidForVerification = originalPayment.imp_uid || originalPayment.transaction_id;
    const merchantUidForVerification = payload.order_id || originalPayment.merchant_uid;
    let iamportPayment;
    try {
      iamportPayment = await verifyIamportPayment({
        impUid: impUidForVerification,
        merchantUid: merchantUidForVerification,
        amount: normalizedTotalAmount
      });
    } catch (verificationError) {
      return res.status(verificationError.statusCode || 400).json({
        success: false,
        message: verificationError.message || '결제 검증에 실패했습니다.'
      });
    }

    payload.payment = {
      method: mapIamportPayMethod(iamportPayment.pay_method, originalPayment.method),
      provider: iamportPayment.pg_provider || iamportPayment.card_name || originalPayment.provider,
      transaction_id: iamportPayment.imp_uid,
      imp_uid: iamportPayment.imp_uid,
      merchant_uid: iamportPayment.merchant_uid || merchantUidForVerification,
      pg_tid: iamportPayment.pg_tid || originalPayment.pg_tid,
      receipt_url: iamportPayment.receipt_url || originalPayment.receipt_url,
      amount_paid: normalizeNumber(iamportPayment.amount, normalizedTotalAmount),
      currency: iamportPayment.currency || originalPayment.currency || 'KRW',
      status: mapIamportStatusToPaymentStatus(iamportPayment.status),
      paid_at: convertUnixTimestamp(iamportPayment.paid_at) || convertUnixTimestamp(originalPayment.paid_at)
    };

    if (!['captured', 'authorized'].includes(payload.payment.status)) {
      return res.status(400).json({
        success: false,
        message: '결제가 완료되지 않았습니다.'
      });
    }

    payload.sub_total = normalizedSubTotal;
    payload.shipping_fee = normalizedShipping;
    payload.total_amount = normalizedTotalAmount;

    if (!payload.user) {
      payload.user = req.user._id;
    } else if (!isAdmin(req.user) && payload.user !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: '다른 사용자를 위한 주문을 생성할 수 없습니다.'
      });
    }

    if (!payload.order_id) {
      payload.order_id = generateOrderId();
    }

    if (payload.status && !isAdmin(req.user)) {
      payload.status = undefined;
    }

    if (Array.isArray(payload.items)) {
      payload.items = payload.items.map((item) => {
        const { cart_item_id, ...rest } = item;
        const quantity = normalizeNumber(rest.quantity, 1);
        const unitPrice = normalizeNumber(rest.unit_price, 0);
        return {
          ...rest,
          quantity,
          unit_price: unitPrice,
          total_price: normalizeNumber(rest.total_price, unitPrice * quantity)
        };
      });
    }

    if (!payload.status && payload.payment) {
      payload.status = normalizeOrderStatusFromPayment(payload.payment.status);
    }

    payload.status_history = [
      {
        status: payload.status || 'pending',
        changedAt: new Date(),
        changedBy: req.user._id
      }
    ];

    const order = await Order.create(payload);
    await clearCartItemsAfterOrder(payload.cart, cartItemIds, req.user);

    const populated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image');

    res.status(201).json({
      success: true,
      message: '주문이 성공적으로 생성되었습니다.',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '주문을 생성하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 주문 전체 수정 (관리자 전용)
exports.updateOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: '주문을 수정할 권한이 없습니다.'
      });
    }

    const updates = { ...req.body };
    const previousStatus = order.status;

    Object.assign(order, updates);

    if (updates.status && updates.status !== previousStatus) {
      order.status_history.push({
        status: updates.status,
        changedAt: new Date(),
        changedBy: req.user._id,
        memo: updates.status_memo
      });
    }

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image');

    res.json({
      success: true,
      message: '주문이 성공적으로 수정되었습니다.',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '주문을 수정하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 주문 일부 수정 (사용자는 배송지/메모만 수정 가능)
exports.patchOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: '주문을 수정할 권한이 없습니다.'
      });
    }

    const updates = { ...req.body };
    const previousStatus = order.status;

    if (!isAdmin(req.user)) {
      const allowedFields = ['shipping_address', 'delivery_note', 'memo'];
      Object.keys(updates).forEach((key) => {
        if (!allowedFields.includes(key)) {
          delete updates[key];
        }
      });
    }

    Object.assign(order, updates);

    if (updates.status && updates.status !== previousStatus) {
      order.status_history.push({
        status: updates.status,
        changedAt: new Date(),
        changedBy: req.user._id,
        memo: updates.status_memo
      });
    }

    await order.save();

    const populated = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('items.product', 'name price image');

    res.json({
      success: true,
      message: '주문 정보가 성공적으로 수정되었습니다.',
      data: populated
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '주문 정보를 수정하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

// 주문 삭제 (관리자 전용)
exports.deleteOrder = async (req, res) => {
  try {
    if (!isAdmin(req.user)) {
      return res.status(403).json({
        success: false,
        message: '주문을 삭제할 권한이 없습니다.'
      });
    }

    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: '주문을 찾을 수 없습니다.'
      });
    }

    res.json({
      success: true,
      message: '주문이 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '주문을 삭제하는 중 오류가 발생했습니다.',
      error: error.message
    });
  }
};

