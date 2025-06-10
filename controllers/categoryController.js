const asyncHandler = require('express-async-handler');
const Category = require('../models/Category');
const { Error } = require('mongoose');

const createCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = new Category({ name, description });
  const createdCategory = await category.save();
  res.status(201).json(createdCategory);
});

const getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({});
  res.json(categories);
});

const updateCategory = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const category = await Category.findById(req.params.id);

  if (!category) {
    res.status(404);
    throw new Error('Danh mục không tồn tại');
  }

  category.name = nam || category.name;
  category.description = description || category.description;

  const updatedCategory = await category.save();
  res.json(updatedCategory);
});

const deleteCategory = asyncHandler(async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        res.status(200).json('Category has been delelted...');
    } catch (err) {
        res.status(500).json(console.error(err))
    }
});

module.exports = { createCategory, getCategories, updateCategory, deleteCategory };
