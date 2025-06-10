const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getProfile, refreshToken, logoutUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect,logoutUser);
router.post('/profile', protect, getProfile);

module.exports = router;
