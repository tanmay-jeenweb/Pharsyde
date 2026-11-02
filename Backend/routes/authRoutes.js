const express = require('express');
const {
  register,
  login,
  getMe,
  getAllUsers,
} = require('../controllers/authController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes (Require JWT)
router.get('/me', protect, getMe);

// Admin-only routes
router.get('/users', protect, authorize('admin'), getAllUsers);

module.exports = router;
