const express = require('express');
const {
  getProducts,
  getProductById,
  createProduct,
  bulkUpsertProducts,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands,
  syncTechPOS,
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Metadata & Sync routes (Must precede /:id)
router.get('/meta/categories', getCategories);
router.get('/meta/brands', getBrands);
router.post('/sync-techpos', syncTechPOS);
router.get('/sync-techpos', syncTechPOS);

// Public product queries
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin-protected routes
router.post('/', protect, authorize('admin'), createProduct);
router.post('/bulk', protect, authorize('admin'), bulkUpsertProducts);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
