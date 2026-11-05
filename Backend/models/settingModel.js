const pool = require('../config/db');

const SETTINGS_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS app_settings (
    \`key\` VARCHAR(100) PRIMARY KEY,
    \`value\` TEXT NOT NULL,
    \`label\` VARCHAR(255) NULL,
    \`description\` TEXT NULL,
    \`category\` VARCHAR(100) DEFAULT 'general',
    \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

// Default settings to seed if table is empty
const DEFAULT_SETTINGS = [
  {
    key: 'new_arrivals_limit',
    value: '24',
    label: 'New Arrivals Display Limit',
    description: 'Number of latest products to display on the customer storefront New Arrivals page by default.',
    category: 'storefront'
  },
  {
    key: 'best_seller_product_ids',
    value: '[]',
    label: 'Best Seller Products',
    description: 'JSON array of selected product IDs to display on the customer storefront Best Sellers page.',
    category: 'storefront'
  },
  {
    key: 'gov_id_mandatory',
    value: 'false',
    label: 'Government ID Mandatory at Checkout',
    description: 'When enabled, customers must upload a valid government-approved ID before completing checkout.',
    category: 'compliance'
  },
  {
    key: 'mobile_latest_version',
    value: '1.0.0',
    label: 'Latest Mobile App Version',
    description: 'The active latest production version code of the mobile app (e.g. 1.0.0).',
    category: 'mobile_app'
  },
  {
    key: 'mobile_min_supported_version',
    value: '1.0.0',
    label: 'Minimum Supported Mobile Version',
    description: 'Any mobile app version strictly below this will always be forced to update immediately.',
    category: 'mobile_app'
  },
  {
    key: 'mobile_apk_url',
    value: 'https://pharsyde.jeenhost.in/apk/app-release.apk',
    label: 'Mobile APK Download URL',
    description: 'Direct public URL to download the latest Android application package (APK).',
    category: 'mobile_app'
  },
  {
    key: 'mobile_force_update',
    value: 'true',
    label: 'Force Mobile App Update',
    description: 'When enabled, users with an outdated or mismatched version cannot dismiss the update screen.',
    category: 'mobile_app'
  },
  {
    key: 'mobile_release_notes',
    value: 'Performance improvements, checkout optimizations, and bug fixes.',
    label: 'Mobile Release Notes',
    description: 'Release changelog notes displayed to the user inside the update modal.',
    category: 'mobile_app'
  }
];

const SettingModel = {
  /**
   * Initialize / verify app_settings table and seed defaults
   */
  async createTable() {
    await pool.query(SETTINGS_TABLE_SCHEMA);
    await this.seedDefaults();
  },

  /**
   * Seed default settings if they don't already exist
   */
  async seedDefaults() {
    for (const setting of DEFAULT_SETTINGS) {
      const [existing] = await pool.query(
        'SELECT `key` FROM app_settings WHERE `key` = ?',
        [setting.key]
      );
      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO app_settings (`key`, `value`, `label`, `description`, `category`) VALUES (?, ?, ?, ?, ?)',
          [setting.key, setting.value, setting.label, setting.description, setting.category]
        );
      }
    }
  },

  /**
   * Get all settings
   */
  async findAll() {
    const [rows] = await pool.query(
      'SELECT `key`, `value`, `label`, `description`, `category`, `updated_at` FROM app_settings ORDER BY `category`, `label` ASC'
    );
    return rows;
  },

  /**
   * Get single setting by key
   */
  async findByKey(key) {
    const [rows] = await pool.query(
      'SELECT `key`, `value`, `label`, `description`, `category`, `updated_at` FROM app_settings WHERE `key` = ?',
      [key]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  /**
   * Get setting value by key with optional fallback
   */
  async getValue(key, defaultValue = null) {
    const setting = await this.findByKey(key);
    return setting ? setting.value : defaultValue;
  },

  /**
   * Upsert a setting
   */
  async upsert(key, value, { label = null, description = null, category = 'general' } = {}) {
    const existing = await this.findByKey(key);
    if (existing) {
      await pool.query(
        'UPDATE app_settings SET `value` = ?, `updated_at` = CURRENT_TIMESTAMP WHERE `key` = ?',
        [String(value), key]
      );
    } else {
      await pool.query(
        'INSERT INTO app_settings (`key`, `value`, `label`, `description`, `category`) VALUES (?, ?, ?, ?, ?)',
        [key, String(value), label, description, category]
      );
    }
    return this.findByKey(key);
  }
};

module.exports = SettingModel;
