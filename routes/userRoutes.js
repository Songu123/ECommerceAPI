const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, refreshToken, logoutUser, updateUser, forgotPassword , resetPassword} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logoutUser);
router.route('/profile')
  .post(protect, getProfile)
  .put(protect, updateUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

module.exports = router;
