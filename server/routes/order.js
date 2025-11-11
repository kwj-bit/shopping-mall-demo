const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require('../middleware/authMiddleware');

function validateOrderCreation(req, res, next) {
  const payload = req.body || {};
  const address = payload.shipping_address || {};

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: '주문에는 최소 1개의 상품이 필요합니다.'
    });
  }

  if (!address.recipient_name || !address.recipient_phone || !address.postal_code || !address.address_line1) {
    return res.status(400).json({
      success: false,
      message: '배송지 정보가 누락되었습니다.'
    });
  }

  return next();
}

router.use(authenticate());

router.get('/', orderController.getOrders);
router.post('/', validateOrderCreation, orderController.createOrder);

router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.patch('/:id', orderController.patchOrder);
router.delete('/:id', orderController.deleteOrder);

module.exports = router;

