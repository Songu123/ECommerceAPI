const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('Email đã tồn tại');
  }

  const user = await User.create({ name, email, password, role });

  res.status(201).json({ _id: user._id, name, email, role: user.role });
});

const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Vui lòng cung cấp email và mật khẩu');
  }

  // Find user and explicitly select password field
  const user = await User.findOne({ email }).select('+password');

  if (user && (await user.matchPassword(password))) {
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    user.refreshToken = refreshToken;
    await user.save();

    res.json({ accessToken, refreshToken, user: { _id: user._id, name: user.name, email, role: user.role } });
  } else {
    res.status(401);
    throw new Error('Thông tin đăng nhập không hợp lệ');
  }
});

const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(401);
    throw new Error('Không có refresh token');
  }

  const user = await User.findOne({ refreshToken });
  if (!user) {
    res.status(403);
    throw new Error('Refresh token không hợp lệ');
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if (decoded.id !== user._id.toString()) {
      res.status(403);
      throw new Error('Refresh token không hợp lệ');
    }

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (error) {
    res.status(403);
    throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
  res.json({ message: 'Đăng xuất thành công' });
});

const getProfile = asyncHandler(async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;

    if (req.body.password) {
      user.password = req.body.password;
    }

    if (req.body.email && req.body.email !== user.email) {
      const userExists = await User.findOne({ email: req.body.email });
      if (userExists) {
        res.status(400);
        throw new Error('Email đã tồn tại');
      }
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy người dùng');
  }
});

module.exports = { registerUser, loginUser, getProfile, refreshToken, logoutUser, updateUser };
