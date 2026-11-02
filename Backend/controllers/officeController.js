const bcrypt = require('bcryptjs');
const UserModel = require('../models/userModel');
const UserTypeModel = require('../models/userTypeModel');
const ProductModel = require('../models/productModel');
const ProductImageModel = require('../models/productImageModel');
const AuditLogModel = require('../models/auditLogModel');
const OrderModel = require('../models/orderModel');
const { generateToken } = require('../utils/jwt');

/**
 * Helper to fetch permissions for a user
 */
async function getUserPermissions(user) {
  if (!user) return [];
  if (user.role === 'admin' || user.user_type === 'Admin') {
    // Admin has full permissions on all masters
    return UserTypeModel.OFFICE_MASTERS.map(m => ({
      master_name: m.key,
      can_read: 1,
      can_write: 1,
      can_update: 1,
      can_delete: 1,
      can_approve: 1,
    }));
  }

  if (user.user_type_id) {
    const ut = await UserTypeModel.findById(user.user_type_id);
    return ut?.permissions || [];
  }

  return [];
}

// ─────────────────────────────────────────────────────────────
// 1. Office Auth & Profile
// ─────────────────────────────────────────────────────────────

const officeLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const identifier = (username || '').trim();

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username or email and password',
      });
    }

    const user = await UserModel.findByUsernameOrEmail(identifier);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User not found.',
      });
    }

    if (user.active === 0 || user.active === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Incorrect password.',
      });
    }

    const permissions = await getUserPermissions(user);
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Record login in audit logs
    await AuditLogModel.log({
      userId: user.id,
      username: user.username || user.name || user.email,
      masterName: 'office_auth',
      changeType: 'LOGIN',
      afterData: { ip: req.ip, userAgent: req.headers['user-agent'] },
      ipAddress: req.ip,
    });

    const safeUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      role: user.role,
      user_type: user.user_type || user.user_group_name || 'Staff',
      user_type_id: user.user_type_id,
      mob_no: user.mob_no,
      date_of_join: user.date_of_join,
    };

    res.status(200).json({
      success: true,
      message: 'Office login successful',
      token,
      user: safeUser,
      permissions,
    });
  } catch (err) {
    next(err);
  }
};

const getOfficeMe = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const permissions = await getUserPermissions(user);
    res.status(200).json({
      success: true,
      user,
      permissions,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 2. Office Dashboard Overview Stats
// ─────────────────────────────────────────────────────────────


/**
 * Fetch Purchase Orders from TechPOS OpenAPI
 * GET https://integrations-api.techpos.ca/{companyCode}/api/openAPI/purchaseOrders/{storeId}
 */
const fetchTechPosPurchaseOrders = async () => {
  const companyCode = process.env.TECHPOS_COMPANY_CODE || '467-41';
  const storeId = process.env.TECHPOS_STORE_ID || '467';
  const apiKey = process.env.TECHPOS_API_KEY || 'Ym9KsXaM3M7W2B301iI3ynU1';
  const url = `https://integrations-api.techpos.ca/${companyCode}/api/openAPI/purchaseOrders/${storeId}`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'TechPOSAPIKey': apiKey,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`[TechPOS PurchaseOrders Warning] HTTP ${res.status}`);
      return [];
    }

    const json = await res.json();
    return json.data?.list || [];
  } catch (err) {
    console.error('[TechPOS PurchaseOrders Error]', err.message);
    return [];
  }
};

const getDashboardStats = async (req, res, next) => {
  try {
    const [allUsers, activeUsers, userTypes, totalProducts, activeProducts, totalImages, imagesWithUrl, recentLogs] = await Promise.all([
      UserModel.findAllOffice({ showInactive: true }),
      UserModel.findAllOffice({ showInactive: false }),
      UserTypeModel.findAll(),
      ProductModel.count({}),
      ProductModel.count({ active: 'true' }),
      ProductImageModel.count(),
      ProductImageModel.countWithImages(),
      AuditLogModel.findAll({ limit: 10 }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: {
          total: allUsers.length,
          active: activeUsers.length,
          inactive: allUsers.length - activeUsers.length,
          typesCount: userTypes.length,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: totalProducts - activeProducts,
        },
        images: {
          total: totalImages,
          withImages: imagesWithUrl,
          missingImages: totalImages - imagesWithUrl,
        },
        recentActivities: recentLogs,
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 3. User Master Controllers
// ─────────────────────────────────────────────────────────────

const getUsers = async (req, res, next) => {
  try {
    const showInactive = req.query.showInactive === 'true';
    const search = req.query.search || '';
    const userTypeId = req.query.userTypeId ? Number(req.query.userTypeId) : null;

    const users = await UserModel.findAllOffice({ showInactive, search, userTypeId });
    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (err) {
    next(err);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

const createUser = async (req, res, next) => {
  try {
    const { name, username, email, password, role, user_type, user_type_id, mob_no, date_of_birth, date_of_join } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const existingEmail = await UserModel.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ success: false, message: 'Email is already registered' });
    }

    if (username) {
      const existingUsername = await UserModel.findByUsernameOrEmail(username);
      if (existingUsername) {
        return res.status(400).json({ success: false, message: 'Username is already taken' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Resolve user_type label from user_type_id if provided
    let userTypeLabel = user_type || 'Staff';
    if (user_type_id) {
      const ut = await UserTypeModel.findById(user_type_id);
      if (ut) userTypeLabel = ut.type_name;
    }

    const newUser = await UserModel.create({
      name,
      username: username || email.split('@')[0],
      email,
      password: hashedPassword,
      role: role || (userTypeLabel.toLowerCase() === 'admin' ? 'admin' : 'user'),
      user_type: userTypeLabel,
      user_type_id: user_type_id || null,
      mob_no,
      date_of_birth,
      date_of_join: date_of_join || new Date(),
      active: true,
    });

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'user_master',
      changeType: 'CREATED',
      afterData: { id: newUser.id, name: newUser.name, email: newUser.email, user_type: newUser.user_type },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: newUser,
    });
  } catch (err) {
    next(err);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await UserModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updates = { ...req.body };

    // If password provided and non-empty, hash it; otherwise do not update password
    if (updates.password && updates.password.trim()) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    } else {
      delete updates.password;
    }

    if (updates.user_type_id) {
      const ut = await UserTypeModel.findById(updates.user_type_id);
      if (ut) updates.user_type = ut.type_name;
    }

    const updatedUser = await UserModel.update(id, updates);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'user_master',
      changeType: 'UPDATED',
      beforeData: existing,
      afterData: updatedUser,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

const toggleUserActive = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await UserModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const newActive = req.body.active !== undefined ? req.body.active : !existing.active;
    const updated = await UserModel.toggleActive(id, newActive);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'user_master',
      changeType: newActive ? 'ACTIVATED' : 'DEACTIVATED',
      beforeData: { id: existing.id, active: existing.active },
      afterData: { id: updated.id, active: updated.active },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `User ${newActive ? 'activated' : 'deactivated'} successfully`,
      user: updated,
    });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await UserModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await UserModel.delete(id);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'user_master',
      changeType: 'DELETED',
      beforeData: existing,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 4. User Type Master Controllers
// ─────────────────────────────────────────────────────────────

const getUserTypes = async (req, res, next) => {
  try {
    const userTypes = await UserTypeModel.findAll();
    res.status(200).json({
      success: true,
      count: userTypes.length,
      data: userTypes,
    });
  } catch (err) {
    next(err);
  }
};

const getUserTypeById = async (req, res, next) => {
  try {
    const userType = await UserTypeModel.findById(req.params.id);
    if (!userType) {
      return res.status(404).json({ success: false, message: 'User type not found' });
    }
    res.status(200).json({ success: true, data: userType });
  } catch (err) {
    next(err);
  }
};

const createUserType = async (req, res, next) => {
  try {
    const { type_name, description, permissions } = req.body;
    if (!type_name) {
      return res.status(400).json({ success: false, message: 'User type name is required' });
    }

    const created = await UserTypeModel.create({ type_name, description, permissions });

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'user_type_master',
      changeType: 'CREATED',
      afterData: created,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'User type created successfully',
      data: created,
    });
  } catch (err) {
    next(err);
  }
};

const updateUserType = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await UserTypeModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User type not found' });
    }

    const { type_name, description, permissions } = req.body;
    const updated = await UserTypeModel.update(id, { type_name, description, permissions });

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'user_type_master',
      changeType: 'UPDATED',
      beforeData: existing,
      afterData: updated,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'User type updated successfully',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

const deleteUserType = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await UserTypeModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'User type not found' });
    }

    await UserTypeModel.delete(id);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'user_type_master',
      changeType: 'DELETED',
      beforeData: existing,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'User type deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 5. Product Master Controllers
// ─────────────────────────────────────────────────────────────

const getOfficeProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      active,
      hasImage,
      limit = 50,
      offset = 0,
      sortBy = 'modified',
      sortOrder = 'DESC',
    } = req.query;

    const [products, total] = await Promise.all([
      ProductModel.findAll({
        search,
        category,
        brand,
        active,
        hasImage,
        limit,
        offset,
        sortBy,
        sortOrder,
      }),
      ProductModel.count({ search, category, brand, active, hasImage }),
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      products,
    });
  } catch (err) {
    next(err);
  }
};

const getOfficeProductById = async (req, res, next) => {
  try {
    const pk = req.params.id;
    const product = await ProductModel.findByPk(pk);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.status(200).json({ success: true, product });
  } catch (err) {
    next(err);
  }
};

const createOfficeProduct = async (req, res, next) => {
  try {
    const data = req.body;
    if (!data.product_name) {
      return res.status(400).json({ success: false, message: 'Product name is required' });
    }

    if (!data.pk) {
      data.pk = 'PRD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    }

    const created = await ProductModel.create(data);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'product_master',
      changeType: 'CREATED',
      afterData: created,
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: created,
    });
  } catch (err) {
    next(err);
  }
};

const updateOfficeProduct = async (req, res, next) => {
  try {
    const pk = req.params.id;
    const existing = await ProductModel.findByPk(pk);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const updated = await ProductModel.update(pk, req.body);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'product_master',
      changeType: 'UPDATED',
      beforeData: existing,
      afterData: updated,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (err) {
    next(err);
  }
};

const toggleOfficeProductActive = async (req, res, next) => {
  try {
    const pk = req.params.id;
    const existing = await ProductModel.findByPk(pk);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const newActive = req.body.active !== undefined ? req.body.active : !existing.active;
    const updated = await ProductModel.update(pk, { active: newActive ? 1 : 0 });

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'product_master',
      changeType: newActive ? 'ACTIVATED' : 'DEACTIVATED',
      beforeData: { pk: existing.pk, name: existing.product_name, active: existing.active },
      afterData: { pk: updated.pk, name: updated.product_name, active: updated.active },
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: `Product ${newActive ? 'activated' : 'deactivated'} successfully`,
      product: updated,
    });
  } catch (err) {
    next(err);
  }
};

const deleteOfficeProduct = async (req, res, next) => {
  try {
    const pk = req.params.id;
    const existing = await ProductModel.findByPk(pk);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await ProductModel.delete(pk);

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'product_master',
      changeType: 'DELETED',
      beforeData: existing,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 6. Product Image Master Controllers
// ─────────────────────────────────────────────────────────────

const getOfficeProductImages = async (req, res, next) => {
  try {
    const { search = '', filter = 'all', limit = 50, offset = 0 } = req.query;
    const result = await ProductImageModel.findAllImages({ search, filter, limit, offset });

    res.status(200).json({
      success: true,
      total: result.total,
      count: result.rows.length,
      images: result.rows,
    });
  } catch (err) {
    next(err);
  }
};

const updateOfficeProductImage = async (req, res, next) => {
  try {
    const id = req.params.id;
    const existing = await ProductImageModel.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Image record not found' });
    }

    const { imageUrl, secondImageUrl } = req.body;
    const updated = await ProductImageModel.updateImages(id, { imageUrl, secondImageUrl });

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'product_image_master',
      changeType: 'UPDATED',
      beforeData: existing,
      afterData: updated,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Image details updated and synced to products',
      image: updated,
    });
  } catch (err) {
    next(err);
  }
};

const syncOfficeProductImages = async (req, res, next) => {
  try {
    const result = await ProductImageModel.syncToProductsTable();

    await AuditLogModel.log({
      userId: req.user?.id || null,
      username: req.user?.name || req.user?.email || 'admin',
      masterName: 'product_image_master',
      changeType: 'SYNC',
      afterData: result,
      ipAddress: req.ip,
    });

    res.status(200).json({
      success: true,
      message: 'Product images synchronized successfully',
      result,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────
// 7. Activity Report Controllers
// ─────────────────────────────────────────────────────────────

const getActivityLogs = async (req, res, next) => {
  try {
    const { masterName, changeType, search, limit = 100, offset = 0 } = req.query;
    const logs = await AuditLogModel.findAll({ masterName, changeType, search, limit, offset });
    const summary = await AuditLogModel.getSummary();

    res.status(200).json({
      success: true,
      count: logs.length,
      summary,
      logs,
    });
  } catch (err) {
    next(err);
  }
};


// ─────────────────────────────────────────────────────────────
// 8. Order Master & TechPOS Purchase Orders Controllers
// ─────────────────────────────────────────────────────────────

const getOfficeOrders = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, status = '' } = req.query;
    const ordersData = await OrderModel.getAllOrders({ limit, offset, status });

    res.status(200).json({
      success: true,
      total: ordersData.total,
      orders: ordersData.orders,
    });
  } catch (err) {
    next(err);
  }
};

const getTechPosPurchaseOrders = async (req, res, next) => {
  try {
    const list = await fetchTechPosPurchaseOrders();
    res.status(200).json({
      success: true,
      count: list.length,
      purchaseOrders: list,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  officeLogin,
  getOfficeMe,
  getDashboardStats,
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserActive,
  deleteUser,
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
  fetchTechPosPurchaseOrders,
};

