const express = require('express');
const {
  officeLogin,
  getOfficeMe,
  getDashboardStats,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser,
  syncTechPOSUsers,
  getUserTypes,
  getUserTypeById,
  createUserType,
  updateUserType,
  deleteUserType,
  getOfficeProducts,
  getOfficeProductById,
  createOfficeProduct,
  updateOfficeProduct,
  toggleOfficeProductActive,
  deleteOfficeProduct,
  getOfficeProductImages,
  updateOfficeProductImage,
  syncOfficeProductImages,
  getActivityLogs,
  getOfficeOrders,
  getTechPosPurchaseOrders,
  getTechPosLiveOrders,
  getTechPosOrderItems,
} = require('../controllers/officeController');
const {
  getOfficeSettings,
  getOfficeSettingByKey,
  updateOfficeSetting,
} = require('../controllers/settingController');
const { verifyToken } = require('../utils/jwt');
const pool = require('../config/db');

const router = express.Router();

/**
 * Flexible middleware that extracts user if Authorization header is provided,
 * without blocking unauthenticated requests where not strictly necessary
 */
const attachOfficeUser = async (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);
      const [rows] = await pool.query('SELECT id, name, username, email, role, user_type FROM users WHERE id = ?', [decoded.id]);
      if (rows.length > 0) {
        req.user = rows[0];
      }
    } catch (e) {
      // Token invalid / expired - proceed without user
    }
  }
  next();
};

router.use(attachOfficeUser);

// 1. Auth & Profile
router.post('/auth/login', officeLogin);
router.post('/login', officeLogin);
router.get('/auth/me', getOfficeMe);

// 2. Dashboard Stats
router.get('/stats', getDashboardStats);

// 3. User Master
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.patch('/users/:id/toggle-active', toggleUserActive);
router.delete('/users/:id', deleteUser);
router.post('/users/sync-techpos', syncTechPOSUsers);

// 4. User Type Master
router.get('/user-types', getUserTypes);
router.get('/user-types/:id', getUserTypeById);
router.post('/user-types', createUserType);
router.put('/user-types/:id', updateUserType);
router.delete('/user-types/:id', deleteUserType);

// 5. Product Master
router.get('/products', getOfficeProducts);
router.get('/products/:id', getOfficeProductById);
router.post('/products', createOfficeProduct);
router.put('/products/:id', updateOfficeProduct);
router.patch('/products/:id/toggle-active', toggleOfficeProductActive);
router.delete('/products/:id', deleteOfficeProduct);

// 6. Product Image Master
router.get('/product-images', getOfficeProductImages);
router.put('/product-images/:id', updateOfficeProductImage);
router.post('/product-images/sync', syncOfficeProductImages);

// 7. Activity Report
router.get('/activity-logs', getActivityLogs);

// 8. Order Master, TechPOS Purchase Orders & Live POS Orders
router.get('/orders', getOfficeOrders);
router.get('/purchase-orders', getTechPosPurchaseOrders);
router.get('/pos-live-orders', getTechPosLiveOrders);
router.get('/pos-order-items/:orderId', getTechPosOrderItems);

// 9. Setting Master
router.get('/settings', getOfficeSettings);
router.get('/settings/:key', getOfficeSettingByKey);
router.put('/settings/:key', updateOfficeSetting);

module.exports = router;
