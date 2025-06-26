const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');

// GET PRODUCT
const getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, search } = req.query;
  const query = {};
  if (category) query.category = category;
  if (search) query.$text = { $search: search };

  const products = await Product.find(query)
    // .populate('category')
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  res.json(products);
});

// CREATE
const createProduct = asyncHandler(async (req, res) => {
  // Lấy thông tin sản phẩm từ body (form-data)
  const { title, desc, categories, size, color, price } = req.body;

  // Đường dẫn ảnh đã upload lên server
  const img = req.file ? `/uploads/${req.file.filename}` : '';

  const product = new Product({
    title,
    desc,
    img,
    categories,
    size,
    color,
    price: parseFloat(price),
  })
  try {
    const savedProduct = await product.save();
    res.status(200).json(savedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

// CREATE MANY PRODUCT
const createManyProducts = asyncHandler(async (req, res) => {
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Expected an array of products.' });
  }

  try {
    const products = await Product.insertMany(req.body, { ordered: false });
    res.status(201).json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
const updateProduct = asyncHandler(async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json(updatedProduct);
  } catch (err) {
    res.status(500).json(err);
  }
});

// DELETE
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json('Product has been delelted...');
  } catch (err) {
    res.status(500).json(console.error(err));
  }
});

module.exports = { getProducts, createProduct, createManyProducts, updateProduct, deleteProduct };
