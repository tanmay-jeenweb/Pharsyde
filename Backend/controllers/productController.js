const ProductModel = require('../models/productModel');
const SettingModel = require('../models/settingModel');
const { syncTechPOSProducts } = require('../services/techposService');
const { syncProductImages } = require('../services/techposImageService');

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering, search, pagination, and sorting
 * @access  Public
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      subCategory,
      brand,
      strain,
      storeId,
      active,
      hasImage,
      search,
      limit = 50,
      offset = 0,
      sortBy = 'modified',
      sortOrder = 'DESC'
    } = req.query;

    const [products, total] = await Promise.all([
      ProductModel.findAll({
        category,
        subCategory,
        brand,
        strain,
        storeId,
        active,
        hasImage,
        search,
        limit,
        offset,
        sortBy,
        sortOrder
      }),
      ProductModel.count({ category, brand, active, hasImage, search, storeId })
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/new-arrivals
 * @desc    Get latest arrivals based on admin setting (default 24)
 * @access  Public
 */
const getNewArrivals = async (req, res, next) => {
  try {
    // 1. Check setting from DB, default to 24
    const configuredLimitStr = await SettingModel.getValue('new_arrivals_limit', '24');
    let limit = parseInt(configuredLimitStr, 10);
    if (isNaN(limit) || limit <= 0) {
      limit = 24;
    }

    // Allow query param override if explicitly requested
    if (req.query.limit && !isNaN(parseInt(req.query.limit, 10)) && parseInt(req.query.limit, 10) > 0) {
      limit = parseInt(req.query.limit, 10);
    }

    // 2. Fetch new arrivals
    const products = await ProductModel.findNewArrivals({ limit });

    res.status(200).json({
      success: true,
      count: products.length,
      limit,
      products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/best-sellers
 * @desc    Get configured best seller products selected from admin Setting Master
 * @access  Public
 */
const getBestSellers = async (req, res, next) => {
  try {
    const rawIds = await SettingModel.getValue('best_seller_product_ids', '[]');
    let productIds = [];
    try {
      productIds = typeof rawIds === 'string' ? JSON.parse(rawIds) : (Array.isArray(rawIds) ? rawIds : []);
    } catch {
      productIds = [];
    }

    let products = [];
    if (Array.isArray(productIds) && productIds.length > 0) {
      products = await ProductModel.findByPks(productIds);
    }

    res.status(200).json({
      success: true,
      count: products.length,
      productIds,
      products,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by pk, sku, or barcode
 * @access  Public
 */
const getProductById = async (req, res, next) => {
  try {
    const identifier = req.params.id;
    let product = await ProductModel.findByPk(identifier);

    // Fallback: check by SKU or Barcode if not matched by pk
    if (!product) {
      product = await ProductModel.findBySku(identifier);
    }
    if (!product) {
      product = await ProductModel.findByBarcode(identifier);
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with identifier '${identifier}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products
 * @desc    Create or upsert a product
 * @access  Private/Admin
 */
const createProduct = async (req, res, next) => {
  try {
    const productData = req.body;

    if (!productData.product_name) {
      return res.status(400).json({
        success: false,
        message: 'Field product_name is required',
      });
    }

    // Auto-generate a pk if not provided
    if (!productData.pk) {
      productData.pk = String(Date.now());
    }

    const newProduct = await ProductModel.upsert(productData);

    res.status(201).json({
      success: true,
      message: 'Product saved successfully',
      product: newProduct,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/bulk
 * @desc    Bulk upsert products (e.g. POS inventory sync feed)
 * @access  Private/Admin
 */
const bulkUpsertProducts = async (req, res, next) => {
  try {
    const items = Array.isArray(req.body) ? req.body : req.body.products;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Expected an array of products or an object with a products array',
      });
    }

    const result = await ProductModel.bulkUpsert(items);

    res.status(200).json({
      success: true,
      message: `Successfully processed ${result.insertedOrUpdated} products`,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/products/:id
 * @desc    Update a product by pk
 * @access  Private/Admin
 */
const updateProduct = async (req, res, next) => {
  try {
    const pk = req.params.id;
    const existing = await ProductModel.findByPk(pk);

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: `Product with pk '${pk}' not found`,
      });
    }

    const updated = await ProductModel.update(pk, req.body);
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete a product by pk
 * @access  Private/Admin
 */
const deleteProduct = async (req, res, next) => {
  try {
    const pk = req.params.id;
    const deleted = await ProductModel.delete(pk);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Product with pk '${pk}' not found`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/meta/categories
 * @desc    Get all distinct categories
 * @access  Public
 */
const getCategories = async (req, res, next) => {
  try {
    const { hasImage } = req.query;
    const categories = await ProductModel.getCategories({ hasImage: hasImage === 'true' });
    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/products/meta/brands
 * @desc    Get all distinct brands
 * @access  Public
 */
const getBrands = async (req, res, next) => {
  try {
    const brands = await ProductModel.getBrands();
    res.status(200).json({
      success: true,
      brands,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/sync-techpos
 * @desc    Fetch and populate products from TechPOS API
 * @access  Public
 */
const syncTechPOS = async (req, res, next) => {
  try {
    const result = await syncTechPOSProducts();
    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/sync-images
 * @desc    Fetch and sync product images directly from TechPOS webmenu eapi into database
 * @access  Public
 */
const syncImages = async (req, res, next) => {
  try {
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const isQuick = params.quick === true || params.quick === 'true';

    const result = await syncProductImages({
      companyCode: params.companyCode,
      branchId: params.branchId,
      pageSize: params.pageSize ? Number(params.pageSize) : 500,
      maxPages: params.maxPages ? Number(params.maxPages) : (isQuick ? 1 : undefined),
      sortId: params.sortId ? Number(params.sortId) : (isQuick ? 9 : 1),
    });

    res.status(200).json({
      success: true,
      message: isQuick
        ? 'Quick product image synchronization completed (first page)'
        : 'Product images synchronized successfully',
      isQuick,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/products/sync-all
 * @desc    Fetch inventory from TechPOS OpenAPI then sync images from TechPOS WebMenu
 * @access  Public
 */
const syncAllTechPOS = async (req, res, next) => {
  try {
    const params = { ...(req.query || {}), ...(req.body || {}) };
    const isQuick = params.quick === true || params.quick === 'true';

    const productResult = await syncTechPOSProducts();
    const imageResult = await syncProductImages({
      companyCode: params.companyCode,
      branchId: params.branchId,
      pageSize: params.pageSize ? Number(params.pageSize) : 500,
      maxPages: params.maxPages ? Number(params.maxPages) : (isQuick ? 1 : undefined),
      sortId: params.sortId ? Number(params.sortId) : (isQuick ? 9 : 1),
    });

    res.status(200).json({
      success: true,
      message: isQuick
        ? 'Quick TechPOS synchronization completed'
        : 'Complete TechPOS product and image synchronization completed',
      isQuick,
      products: productResult,
      images: imageResult,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
