const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  retryTechPosSync,
  getOfficeOrders,
  cancelOrder,
  checkOrderStock,
} = require('../controllers/orderController');
const { verifyToken } = require('../utils/jwt');
const pool = require('../config/db');

const router = express.Router();

/**
 * Optional user attachment middleware:
 * Attaches req.user if valid JWT token is present, but allows guest requests through.
 */
const attachUserIfPresent = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        try {
          const [rows] = await pool.query(
            'SELECT id, name, email, role, user_type, mob_no, date_of_birth FROM users WHERE id = ?',
            [decoded.id]
          );
          if (rows.length > 0) {
            req.user = rows[0];
          }
        } catch {
          // If DB is offline, decode basic JWT claims into req.user
          req.user = { id: decoded.id, email: decoded.email, role: decoded.role || 'user', user_type: decoded.user_type || 'User' };
        }
      }
    } catch {
      // Token invalid or expired - proceed as guest
    }
  }
  next();
};

router.use(attachUserIfPresent);

// Public / Customer order creation
router.post('/', createOrder);

// Customer order retrieval
router.get('/', getMyOrders);
router.get('/my-orders', getMyOrders);

// Office / Admin order list
router.get('/office/all', getOfficeOrders);

// Single order inspection
router.get('/:id', getOrderById);

// Order cancellation with stock restoration & TechPOS sync
router.post('/:id/cancel', cancelOrder);

// TechPOS & local real-time stock inspection for order items
router.get('/:id/stock-check', checkOrderStock);

// TechPOS manual re-sync
router.post('/:id/sync-techpos', retryTechPosSync);

module.exports = router;

