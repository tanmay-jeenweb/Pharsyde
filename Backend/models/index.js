const UserModel = require('./userModel');
const ProductModel = require('./productModel');
const ProductImageModel = require('./productImageModel');

/**
 * Initialize database tables defined inside all models
 */
const initModelTables = async () => {
  await UserModel.createTable();
  await ProductModel.createTable();
  await ProductImageModel.createTable();
};

module.exports = {
  initModelTables,
  UserModel,
  ProductModel,
  ProductImageModel,
};
