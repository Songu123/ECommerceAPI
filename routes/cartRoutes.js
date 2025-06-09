const express = require('express');
const router = express.Router();
const { addToCart, getCart, updateCart, deleteFromCart } = require('../controllers/cartController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, addToCart).get(protect, getCart);
router.put('/:id', protect, updateCart);
router.delete('/:id', protect, deleteFromCart);

module.exports = router