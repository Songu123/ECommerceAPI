const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');

// Post: add to cart
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }
  const itemIndex = cart.items.findIndex((item) => item.product.toString() === productId);
  if (itemIndex > -1) {
    cart.items[itemIndex].quantity += quantity;
  } else {
    cart.items.push({ product: productId, quantity });
  }
  cart.updatedAt = Date.now();
  await cart.save();
  res.json(cart);
});

// Get: get all cart
const getCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  if (!cart) {
    res.status(404);
    throw new Error('Giỏ hàng không tìm thấy');
  }
  res.json(cart);
});

// Post: update cart
const updateCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;
  if (!productId || !Number.isInteger(quantity) || quantity < 0) {
    res.status(400);
    throw new Error('Thông tin sản phẩm hoặc số lượng không hợp lệ');
  }

  const cart = await Cart.findOne({ user: req.user_id });
  if (!cart) {
    res.status(404);
    throw new Error('Giỏ hàng không tìm thấy');
  }

  const itemIndex = cart.items.findIndex((item) => {
    item.product.toString() === productId;
  });
  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Sản phẩm không có trong giỏ hàng');
  }

  if (quantity === 0) {
    cart.items.splice(itemIndex, 1);
  } else {
    cart.items[itemIndex].quantity = quantity;
  }

  cart.updatedAt = Date.now();
  await cart.save();
  res.json(cart);
});

const deleteFromCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    res.status(404);
    throw new Error('Giỏ hàng không tìm thấy');
  }

  console.log(cart);

  const itemIndex = cart.items.findIndex((item) => {
    return item.product.toString() === req.params.id;
  });
  if (itemIndex === -1) {
    res.status(404);
    throw new Error('Sản phẩm không có trong giỏ hàng');
  }

  cart.items.splice(itemIndex, 1);
  cart.updateCart = Date.now();
  await cart.save();
  res.json(cart);
});

module.exports = { addToCart, getCart, updateCart, deleteFromCart };
