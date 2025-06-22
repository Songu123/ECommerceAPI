const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [50, 'Name must be at most 50 characters'],
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function (v) {
        return validator.isEmail(v);
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: '{VALUE} is not a valid role',
    },
    default: 'user',
  },
  refreshToken: { type: String, select: false },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLogin: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

// Mã hoá mật khẩu
userSchema.pre('save', async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);

    // Hash the password along with the new salt
    this.password = await bcrypt.hash(this.password, salt);

    // Update updatedAt field
    this.updatedAt = Date.now();

    next();
  } catch (error) {
    next(error);
  }
});

// So sánh mật khẩu - Sửa lại phương thức này
userSchema.methods.matchPassword = async function (enteredPassword) {
  if (!enteredPassword || !this.password) {
    return false;
  }
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-update middleware to update the updatedAt field
userSchema.pre(['updateOne', 'findOneAndUpdate'], function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

// Method to check if refresh token is valid
userSchema.methods.hasValidRefreshToken = function (token) {
  return this.refreshToken === token;
};

// Static method to find user by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Create a compound index to optimize queries
userSchema.index({ email: 1 });

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  // Hash token lưu DB, token gốc gửi qua email
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 phút
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
