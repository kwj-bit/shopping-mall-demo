const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// 상품 목록 조회
router.get('/', productController.getProducts);

// 상품 단건 조회 (MongoDB ObjectId 사용)
router.get('/:id', productController.getProductById);

// 상품 등록
router.post('/', productController.createProduct);

// 상품 전체 수정
router.put('/:id', productController.updateProduct);

// 상품 부분 수정
router.patch('/:id', productController.patchProduct);

// 상품 삭제
router.delete('/:id', productController.deleteProduct);

module.exports = router;



