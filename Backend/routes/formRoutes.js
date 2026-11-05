const express = require('express');
const {
  submitContactInquiry,
  subscribeNewsletter
} = require('../controllers/formController');

const router = express.Router();

// Storefront Customer Form Submissions
router.post('/contact', submitContactInquiry);
router.post('/newsletter', subscribeNewsletter);

module.exports = router;

