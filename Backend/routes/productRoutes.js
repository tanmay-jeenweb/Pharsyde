const express = require('express');
const {
  getProducts,
  getNewArrivals,
  getBestSellers,
  getProductById,
  createProduct,
  bulkUpsertProducts,
  updateProduct,
  deleteProduct,
  getCategories,
  getBrands,
  syncTechPOS,
  syncImages,
  syncAllTechPOS,
} = require('../controllers/productController');
const { protect, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Metadata & Sync routes (Must precede /:id)
router.get('/meta/categories', getCategories);
router.get('/meta/brands', getBrands);
router.post('/sync-techpos', syncTechPOS);
router.get('/sync-techpos', syncTechPOS);
router.post('/sync-images', syncImages);
router.get('/sync-images', syncImages);
router.post('/sync-all', syncAllTechPOS);
router.get('/sync-all', syncAllTechPOS);

// Public product queries
router.get('/', getProducts);
router.get('/new-arrivals', getNewArrivals);
router.get('/best-sellers', getBestSellers);
router.get('/:id', getProductById);

// Admin-protected routes
router.post('/', protect, authorize('admin'), createProduct);
router.post('/bulk', protect, authorize('admin'), bulkUpsertProducts);
router.put('/:id', protect, authorize('admin'), updateProduct);
router.delete('/:id', protect, authorize('admin'), deleteProduct);

module.exports = router;
