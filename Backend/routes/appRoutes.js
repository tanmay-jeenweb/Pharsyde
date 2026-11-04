const express = require('express');
const {
  checkAppVersion,
  downloadApk,
  setAppVersion,
} = require('../controllers/appVersionController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// Public endpoints for mobile client / browser direct access
router.get('/check-update', checkAppVersion);
router.post('/check-update', checkAppVersion);
router.get('/version', checkAppVersion);
router.get('/download', downloadApk);
router.post('/download', downloadApk);

// Protected endpoints for admin to update version parameters
router.post('/version', protect, setAppVersion);
router.put('/version', protect, setAppVersion);

module.exports = router;

