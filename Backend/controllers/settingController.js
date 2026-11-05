const SettingModel = require('../models/settingModel');
const AuditLogModel = require('../models/auditLogModel');

/**
 * @route   GET /api/office/settings
 * @desc    Get all settings for Office Admin
 * @access  Office Authenticated
 */
const getOfficeSettings = async (req, res, next) => {
  try {
    const settings = await SettingModel.findAll();
    res.status(200).json({
      success: true,
      count: settings.length,
      settings,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/office/settings/:key
 * @desc    Get single setting by key
 * @access  Office Authenticated
 */
const getOfficeSettingByKey = async (req, res, next) => {
  try {
    const { key } = req.params;
    const setting = await SettingModel.findByKey(key);
    if (!setting) {
      return res.status(404).json({
        success: false,
        message: `Setting with key "${key}" not found.`,
      });
    }
    res.status(200).json({
      success: true,
      setting,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   PUT /api/office/settings/:key
 * @desc    Update setting value by key
 * @access  Office Authenticated
 */
const updateOfficeSetting = async (req, res, next) => {
  try {
    const { key } = req.params;
    const { value, label, description, category } = req.body;
    let finalValue = typeof value === 'object' ? JSON.stringify(value) : (value !== undefined && value !== null ? String(value).trim() : '');

    if (value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'A valid setting value is required.',
      });
    }

    // Specific validation for new_arrivals_limit
    if (key === 'new_arrivals_limit') {
      const numVal = parseInt(value, 10);
      if (isNaN(numVal) || numVal < 1) {
        return res.status(400).json({
          success: false,
          message: 'New Arrivals Display Limit must be a positive number of at least 1.',
        });
      }
      if (numVal > 120) {
        return res.status(400).json({
          success: false,
          message: 'New Arrivals Display Limit cannot exceed 120 products.',
        });
      }
    }

    // Specific validation for show_best_sellers & show_new_arrivals
    if (key === 'show_best_sellers' || key === 'show_new_arrivals') {
      const strVal = String(value).trim().toLowerCase();
      if (strVal !== 'true' && strVal !== 'false') {
        return res.status(400).json({
          success: false,
          message: `${key} setting must be either "true" or "false".`,
        });
      }
      finalValue = strVal;
    }

    // Specific validation for gov_id_mandatory
    if (key === 'gov_id_mandatory') {
      const strVal = String(value).trim().toLowerCase();
      if (strVal !== 'true' && strVal !== 'false') {
        return res.status(400).json({
          success: false,
          message: 'Government ID Mandatory setting must be either "true" or "false".',
        });
      }
      finalValue = strVal;
    }

    // Specific validation for cannabis_max_grams
    if (key === 'cannabis_max_grams') {
      const numVal = parseFloat(value);
      if (isNaN(numVal) || numVal <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannabis Purchase Limit must be a positive number greater than 0.',
        });
      }
      if (numVal > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Cannabis Purchase Limit cannot exceed 1000 grams.',
        });
      }
      finalValue = String(Math.round(numVal * 100) / 100);
    }

    // Specific validation for free_delivery_threshold
    if (key === 'free_delivery_threshold') {
      const numVal = parseFloat(value);
      if (isNaN(numVal) || numVal < 0) {
        return res.status(400).json({
          success: false,
          message: 'Free delivery threshold must be a number equal to or greater than 0.',
        });
      }
      finalValue = String(Math.round(numVal * 100) / 100);
    }

    // Specific validation for mobile_force_update
    if (key === 'mobile_force_update') {
      const strVal = String(value).trim().toLowerCase();
      if (strVal !== 'true' && strVal !== 'false') {
        return res.status(400).json({
          success: false,
          message: 'Force update setting must be either "true" or "false".',
        });
      }
      finalValue = strVal;
    }

    // Specific validation for best_seller_product_ids
    if (key === 'best_seller_product_ids') {
      try {
        const parsed = JSON.parse(finalValue);
        if (!Array.isArray(parsed)) {
          return res.status(400).json({
            success: false,
            message: 'Best Seller product selection must be an array of product IDs.',
          });
        }
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON array provided for best_seller_product_ids.',
        });
      }
    }

    // Retrieve previous state for audit log
    const beforeSetting = await SettingModel.findByKey(key);

    const updatedSetting = await SettingModel.upsert(key, finalValue, {
      label: label !== undefined ? label : beforeSetting?.label,
      description: description !== undefined ? description : beforeSetting?.description,
      category: category !== undefined ? category : beforeSetting?.category,
    });

    // Record audit log safely without letting audit errors block the setting update
    try {
      await AuditLogModel.log({
        userId: req.user?.id || null,
        username: req.user?.name || req.user?.email || 'admin',
        ipAddress: req.ip || req.connection?.remoteAddress,
        masterName: 'setting_master',
        recordId: key,
        changeType: beforeSetting ? 'UPDATE' : 'CREATE',
        beforeState: beforeSetting,
        afterState: updatedSetting,
        description: `Updated setting "${key}" to "${value}"`,
      });
    } catch (auditErr) {
      console.warn('[AuditLog Warning] Could not record setting audit log:', auditErr.message);
    }

    res.status(200).json({
      success: true,
      message: `Setting "${key}" updated successfully.`,
      setting: updatedSetting,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @route   GET /api/settings/public
 * @desc    Get public storefront & mobile settings
 * @access  Public
 */
const getPublicSettings = async (req, res, next) => {
  try {
    // Ensure browsers & mobile clients never cache settings statically
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const all = await SettingModel.findAll();
    // Whitelist only public safe settings
    const publicKeys = [
      'show_best_sellers',
      'show_new_arrivals',
      'new_arrivals_limit', 
      'best_seller_product_ids', 
      'gov_id_mandatory',
      'cannabis_max_grams',
      'free_delivery_threshold',
      'mobile_latest_version',
      'mobile_min_supported_version',
      'mobile_apk_url',
      'mobile_force_update',
      'mobile_release_notes'
    ];
    const publicSettings = {};

    for (const s of all) {
      if (publicKeys.includes(s.key)) {
        publicSettings[s.key] = s.value;
      }
    }

    // Ensure fallback defaults exist
    if (publicSettings.show_best_sellers === undefined) {
      publicSettings.show_best_sellers = 'true';
    }
    if (publicSettings.show_new_arrivals === undefined) {
      publicSettings.show_new_arrivals = 'true';
    }
    if (!publicSettings.new_arrivals_limit) {
      publicSettings.new_arrivals_limit = '24';
    }
    if (!publicSettings.best_seller_product_ids) {
      publicSettings.best_seller_product_ids = '[]';
    }
    if (!publicSettings.cannabis_max_grams) {
      publicSettings.cannabis_max_grams = '30.0';
    }
    if (!publicSettings.free_delivery_threshold) {
      publicSettings.free_delivery_threshold = '75.0';
    }
    if (!publicSettings.mobile_latest_version) {
      publicSettings.mobile_latest_version = '1.0.0';
    }

    res.status(200).json({
      success: true,
      settings: publicSettings,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getOfficeSettings,
  getOfficeSettingByKey,
  updateOfficeSetting,
  getPublicSettings,
};
