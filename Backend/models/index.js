const UserModel = require('./userModel');
const ProductModel = require('./productModel');
const ProductImageModel = require('./productImageModel');
const UserTypeModel = require('./userTypeModel');
const AuditLogModel = require('./auditLogModel');
const OrderModel = require('./orderModel');
const SettingModel = require('./settingModel');
const HomeSectionModel = require('./homeSectionModel');

/**
 * Initialize database tables defined inside all models in correct order
 */
const initModelTables = async () => {
  // 1. Audit logs table
  await AuditLogModel.createTable();
  // 2. User types & permissions tables
  await UserTypeModel.createTable();
  // 3. Users table (with user_type foreign references and default admin)
  await UserModel.createTable();
  // 4. Products table
  await ProductModel.createTable();
  // 5. TechPOS product images table
  await ProductImageModel.createTable();
  // 6. Orders and Order Items tables
  await OrderModel.createTable();
  // 7. System & App Settings table
  await SettingModel.createTable();
  // 8. Dynamic Home Page Sections table
  await HomeSectionModel.createTable();
};

module.exports = {
  initModelTables,
  UserModel,
  ProductModel,
  ProductImageModel,
  UserTypeModel,
  AuditLogModel,
  OrderModel,
  SettingModel,
  HomeSectionModel,
};
