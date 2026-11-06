const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

// Fallback JSON storage if MySQL is disconnected during development/offline
const FALLBACK_SETTINGS_FILE = path.resolve(__dirname, '../data/fallback_settings.json');

const getFallbackSettings = () => {
  try {
    if (fs.existsSync(FALLBACK_SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(FALLBACK_SETTINGS_FILE, 'utf8'));
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (err) {
    console.warn('[SettingModel Fallback Read Error]', err.message);
  }
  return DEFAULT_SETTINGS.map((s) => ({ ...s, updated_at: new Date().toISOString() }));
};

const saveFallbackSettings = (settings) => {
  try {
    const dir = path.dirname(FALLBACK_SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const newContent = JSON.stringify(settings, null, 2);
    if (fs.existsSync(FALLBACK_SETTINGS_FILE)) {
      const currentContent = fs.readFileSync(FALLBACK_SETTINGS_FILE, 'utf8');
      if (currentContent === newContent) {
        return; // Content unchanged, avoid triggering file watchers
      }
    }
    fs.writeFileSync(FALLBACK_SETTINGS_FILE, newContent, 'utf8');
  } catch (err) {
    console.error('[SettingModel Fallback Write Error]', err.message);
  }
};

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
    key: 'show_best_sellers',
    value: 'true',
    label: 'Show Best Sellers Section on Home Page',
    description: 'Toggle switch to show or hide the Best Sellers section on the customer storefront home page.',
    category: 'storefront'
  },
  {
    key: 'show_new_arrivals',
    value: 'true',
    label: 'Show New Arrivals Section on Home Page',
    description: 'Toggle switch to show or hide the New Arrivals section on the customer storefront home page.',
    category: 'storefront'
  },
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
    key: 'cannabis_max_grams',
    value: '30.0',
    label: 'Cannabis Purchase Limit (Grams)',
    description: 'Maximum allowed dried cannabis equivalent in grams (DFE) per customer order/transaction.',
    category: 'compliance'
  },
  {
    key: 'free_delivery_threshold',
    value: '75.0',
    label: 'Free Delivery Minimum Threshold ($ CAD)',
    description: 'Minimum product subtotal required for a customer order to qualify for free courier delivery.',
    category: 'storefront'
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
    value: 'https://pharsyde.ca/apk/app-release.apk',
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
  },
  {
    key: 'reward_points_per_cad_spent',
    value: '1.0',
    label: 'Reward Points Earned per $1 CAD Spent',
    description: 'Number of reward points a customer earns for each $1 CAD spent on completed purchases (1 CAD = 1 point).',
    category: 'storefront'
  },
  {
    key: 'reward_points_redemption_rate',
    value: '1000',
    label: 'Reward Points per $1 CAD Redemption',
    description: 'Number of reward points required to redeem $1.00 CAD instant discount at checkout (1,000 points = $1.00 CAD).',
    category: 'storefront'
  },
  {
    key: 'reward_point_dollar_rate',
    value: '0.001',
    label: 'Reward Point Dollar Value ($ CAD per Point)',
    description: 'Cash discount value of 1 reward point in CAD ($0.001 CAD per point).',
    category: 'storefront'
  }
];

const SettingModel = {
  /**
   * Initialize / verify app_settings table and seed defaults
   */
  async createTable() {
    try {
      await pool.query(SETTINGS_TABLE_SCHEMA);
      await this.seedDefaults();
    } catch (dbErr) {
      console.warn('[SettingModel DB Warning] Could not initialize MySQL table:', dbErr.message);
    }
    // Only create fallback settings file if it doesn't already exist
    if (!fs.existsSync(FALLBACK_SETTINGS_FILE)) {
      const fallback = getFallbackSettings();
      saveFallbackSettings(fallback);
    }
  },

  /**
   * Seed default settings if they don't already exist
   */
  async seedDefaults() {
    try {
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
    } catch (err) {
      console.warn('[SettingModel DB Warning] seedDefaults MySQL query failed:', err.message);
    }
  },

  /**
   * Get all settings
   */
  async findAll() {
    try {
      const [rows] = await pool.query(
        'SELECT `key`, `value`, `label`, `description`, `category`, `updated_at` FROM app_settings ORDER BY `category`, `label` ASC'
      );
      if (Array.isArray(rows) && rows.length > 0) {
        return rows;
      }
    } catch (err) {
      console.warn('[SettingModel DB Warning] findAll MySQL query failed, using fallback JSON:', err.message);
    }
    return getFallbackSettings();
  },

  /**
   * Get single setting by key
   */
  async findByKey(key) {
    try {
      const [rows] = await pool.query(
        'SELECT `key`, `value`, `label`, `description`, `category`, `updated_at` FROM app_settings WHERE `key` = ?',
        [key]
      );
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch (err) {
      console.warn(`[SettingModel DB Warning] findByKey(${key}) MySQL query failed, using fallback JSON:`, err.message);
    }
    const fallback = getFallbackSettings();
    return fallback.find((s) => s.key === key) || null;
  },

  /**
   * Get setting value by key with optional fallback
   */
  async getValue(key, defaultValue = null) {
    const setting = await this.findByKey(key);
    return setting && setting.value !== undefined && setting.value !== null ? setting.value : defaultValue;
  },

  /**
   * Upsert a setting
   */
  async upsert(key, value, { label = null, description = null, category = 'general' } = {}) {
    const strVal = String(value);
    const nowIso = new Date().toISOString();

    // 1. Always update local fallback JSON storage if changed
    const fallback = getFallbackSettings();
    const existingIndex = fallback.findIndex((s) => s.key === key);
    let updatedRecord;
    if (existingIndex > -1) {
      const existing = fallback[existingIndex];
      const hasChanged =
        existing.value !== strVal ||
        (label !== null && label !== undefined && existing.label !== label) ||
        (description !== null && description !== undefined && existing.description !== description) ||
        (category !== null && category !== undefined && existing.category !== category);

      if (hasChanged) {
        fallback[existingIndex] = {
          ...existing,
          value: strVal,
          label: label !== null && label !== undefined ? label : existing.label,
          description: description !== null && description !== undefined ? description : existing.description,
          category: category !== null && category !== undefined ? category : existing.category,
          updated_at: nowIso,
        };
        saveFallbackSettings(fallback);
      }
      updatedRecord = fallback[existingIndex];
    } else {
      updatedRecord = {
        key,
        value: strVal,
        label,
        description,
        category,
        updated_at: nowIso,
      };
      fallback.push(updatedRecord);
      saveFallbackSettings(fallback);
    }

    // 2. Also try MySQL persistence
    try {
      const [existingRows] = await pool.query(
        'SELECT `key` FROM app_settings WHERE `key` = ?',
        [key]
      );
      if (existingRows.length > 0) {
        await pool.query(
          'UPDATE app_settings SET `value` = ?, `updated_at` = CURRENT_TIMESTAMP WHERE `key` = ?',
          [strVal, key]
        );
      } else {
        await pool.query(
          'INSERT INTO app_settings (`key`, `value`, `label`, `description`, `category`) VALUES (?, ?, ?, ?, ?)',
          [key, strVal, label, description, category]
        );
      }
      const [freshRows] = await pool.query(
        'SELECT `key`, `value`, `label`, `description`, `category`, `updated_at` FROM app_settings WHERE `key` = ?',
        [key]
      );
      if (freshRows.length > 0) {
        return freshRows[0];
      }
    } catch (err) {
      console.warn(`[SettingModel DB Warning] upsert(${key}) MySQL query failed, saved to fallback JSON:`, err.message);
    }

    return updatedRecord;
  }
};

module.exports = SettingModel;
