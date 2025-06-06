const asyncHandler = require('express-async-handler')
const Order = require('../models/Order')

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

const getOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({user: req.user._id}).populate('items.product')
    res.json(orders)
})

module.exports = {createOrder, getOrders}