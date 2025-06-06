const express = require('express');
const router = express.Router();
const { getProducts, createProduct,createManyProducts, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect, isAdmin } = require('../middleware/authMiddleware');

router.get('/', getProducts);
router.post('/', protect, isAdmin, createProduct);
router.post('/bulk', protect, isAdmin, createManyProducts);
router.put('/:id', protect, isAdmin, updateProduct);
router.delete('/:id', protect, isAdmin, deleteProduct);

module.exports = router