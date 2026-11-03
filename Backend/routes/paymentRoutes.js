const express = require('express');
const {
  initiatePaymentAttempt,
  finalizePayment,
  cancelPayment,
  getPaymentSession,
} = require('../controllers/paymentController');
const { verifyToken } = require('../utils/jwt');
const pool = require('../config/db');

const router = express.Router();

/**
 * Optional user attachment middleware
 */
const attachUserIfPresent = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        try {
          const [rows] = await pool.query(
            'SELECT id, name, email, role, mob_no, date_of_birth FROM users WHERE id = ?',
            [decoded.id]
          );
          if (rows.length > 0) {
            req.user = rows[0];
          }
        } catch {
          req.user = { id: decoded.id, email: decoded.email, role: decoded.role || 'user' };
        }
      }
    } catch {
      // Proceed as guest
    }
  }
  next();
};

router.use(attachUserIfPresent);

// Moneris Hosted Checkout Lifecycle Endpoints
router.post('/preload', initiatePaymentAttempt);
router.post('/initiate', initiatePaymentAttempt);
router.post('/finalize', finalizePayment);
router.post('/cancel', cancelPayment);
router.get('/session/:id', getPaymentSession);

module.exports = router;

