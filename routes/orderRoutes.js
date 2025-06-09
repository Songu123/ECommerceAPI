const express = require('express')
const router = express.Router()
const {createOrder, getOrders, deleteOrder} = require('../controllers/orderController')
const {protect} = require('../middleware/authMiddleware')

router.route('/').post(protect, createOrder).get(protect, getOrders)
router.route('/:id').delete(protect, deleteOrder)

module.exports = router