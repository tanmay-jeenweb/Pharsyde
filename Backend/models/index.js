const UserModel = require('./userModel');
const ProductModel = require('./productModel');

/**
 * Initialize database tables defined inside UserModel and ProductModel
 */
const initModelTables = async () => {
  await UserModel.createTable();
  await ProductModel.createTable();
};

module.exports = {
  initModelTables,
  UserModel,
  ProductModel,
};
