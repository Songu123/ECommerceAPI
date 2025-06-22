const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Đăng ký người dùng mới
// Kiểm tra xem email đã tồn tại chưa, nếu có thì trả về lỗi
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

// Tạo access token và refresh token
// Access token có thời gian sống ngắn (15 phút), refresh token có thời gian sống
const generateAccessToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '15m' });
};
const generateRefreshToken = (user) => {
  return jwt.sign({ id: user._id, role: user.role }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
};

// Đăng nhập người dùng
// Kiểm tra xem email và mật khẩu có hợp lệ không, nếu hợp lệ thì trả về access token và refresh token
// Nếu không hợp lệ thì trả về lỗi
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

    res.json({
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email,
        role: user.role,
        resetPasswordToken: user.resetPasswordToken,
        resetPasswordExpires: user.resetPasswordExpires,
      },
    });
  } else {
    res.status(401);
    throw new Error('Thông tin đăng nhập không hợp lệ');
  }
});

// Làm mới access token bằng refresh token
// Kiểm tra xem refresh token có hợp lệ không, nếu hợp lệ thì trả về access token mới
// Nếu không hợp lệ thì trả về lỗi
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

// Đăng xuất người dùng
// Xoá refresh token khỏi cơ sở dữ liệu để người dùng không thể sử dụng nó
const logoutUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = null;
    await user.save();
  }
  res.json({ message: 'Đăng xuất thành công' });
});

// Lấy thông tin người dùng hiện tại
// Trả về thông tin người dùng đã đăng nhập, bao gồm id, tên, email
const getProfile = asyncHandler(async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    role: req.user.role,
  });
});

// Cập nhật thông tin người dùng
// Cho phép người dùng cập nhật tên, email và mật khẩu của mình
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

// Xử lý quên mật khẩu người dùng
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Vui lòng cung cấp địa chỉ email');
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng với email này');
  }

  // Tạo token đặt lại mật khẩu
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // Token hết hạn sau 30 phút
  await user.save({ validateBeforeSave: false });

  // Tạo URL đặt lại mật khẩu
  const resetUrl = `${req.protocol}://${req.get('host')}/api/users/reset-password/${resetToken}`;

  const htmlMessage = `
    <h1>Yêu cầu đặt lại mật khẩu</h1>
    <p>Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
    <p>Vui lòng click vào link dưới đây để đặt lại mật khẩu:</p>
    <a href="${resetUrl}" style="display: inline-block; background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
    <p>Link này sẽ hết hạn sau 30 phút.</p>
    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
  `;

  try {
    await sendEmail({
      to: user.email,
      subject: 'Yêu cầu đặt lại mật khẩu',
      text: `Bạn nhận được email này vì đã yêu cầu đặt lại mật khẩu. Truy cập link sau để đặt lại mật khẩu: ${resetUrl}`,
      html: htmlMessage,
    });

    res.json({
      message: 'Email đặt lại mật khẩu đã được gửi',
      resetToken,
    });
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('Lỗi gửi email:', err);
    res.status(500);
    throw new Error('Không thể gửi email. Lỗi: ' + err.message);
  }
});

//
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const hashdedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashdedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) return res.status(404).json({ message: 'Token không hợp lệ hoặc đã hết hạn' });

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Mật khẩu đã được đặt lại thành công' });
});

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  refreshToken,
  logoutUser,
  updateUser,
  forgotPassword,
  resetPassword,
};
