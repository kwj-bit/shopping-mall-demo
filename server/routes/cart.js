const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticate } = require('../middleware/authMiddleware');

// 토큰 인증 및 사용자 검증
router.use(authenticate());
router.use('/:userId', (req, res, next) => {
  const { userId } = req.params;
  const isAdmin = req.user?.user_type === 'admin';
  const isSelf = req.user?._id?.toString() === userId;

  if (isAdmin || isSelf) {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: '해당 장바구니에 접근할 권한이 없습니다.'
  });
});

// 장바구니 생성 또는 조회
router.post('/:userId', cartController.createOrGetCart);
router.get('/:userId', cartController.getCart);

// 장바구니 상태 업데이트
router.patch('/:userId', cartController.updateStatus);

// 장바구니 아이템 추가
router.post('/:userId/items', cartController.addItem);

// 장바구니 아이템 수정 및 삭제
router.patch('/:userId/items/:itemId', cartController.updateItem);
router.delete('/:userId/items/:itemId', cartController.removeItem);

// 장바구니 비우기
router.delete('/:userId', cartController.clearCart);

module.exports = router;

