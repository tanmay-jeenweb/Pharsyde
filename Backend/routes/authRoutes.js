const express = require('express');
const {
  register,
  login,
  getMe,
  getAllUsers,
  checkEmail,
} = require('../controllers/authController');
const { sendOtp, verifyOtp } = require('../controllers/otpController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/check-email', checkEmail);
router.post('/check-email', checkEmail);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);

// Protected routes (Require JWT)
router.get('/me', protect, getMe);

// Admin-only routes
router.get('/users', protect, authorize('admin'), getAllUsers);

module.exports = router;
