const asyncHandler = require('express-async-handler')
const Order = require('../models/Order')

// Post: create order
const createOrder = asyncHandler(async (req, res) => {
    const {items, totalPrice} = req.body
    const order = new Order({
        user: req.user._id,
        items,
        totalPrice
    })
    const createdOrder = await order.save()
    res.status(201).json(createdOrder)
})

// Get: get all orders
const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({user: req.user._id}).populate('items.product')
    res.json(orders)
})

// Delete: delete order
const deleteOrder = asyncHandler(async (req, res) => {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id)
    res.status(204).json(deletedOrder)
})

module.exports = {createOrder, getOrders, deleteOrder}