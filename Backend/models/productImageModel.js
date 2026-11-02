const pool = require('../config/db');

/**
 * Table schema for storing lean TechPOS image sync data
 */
const PRODUCT_IMAGE_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS techpos_product_images (
    id VARCHAR(50) PRIMARY KEY,
    sku VARCHAR(100) NULL,
    name VARCHAR(255) NULL,
    imageUrl VARCHAR(500) NULL,
    secondImageUrl VARCHAR(500) NULL,
    raw_images_urls TEXT NULL,
    source_page INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_image_sku (sku)
  )
`;

/**
 * Extract and clean image URLs from raw response
 * Handles Arrays, JSON strings, or bracketed CSV text
 */
function extractImageUrls(raw) {
  let urls = [];

  if (Array.isArray(raw)) {
    urls = raw.map((u) => String(u || '').trim()).filter(Boolean);
  } else if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          urls = parsed.map((u) => String(u || '').trim()).filter(Boolean);
        }
      } catch {
        const unbracketed = trimmed.replace(/[\[\]"]/g, '').trim();
        urls = unbracketed.split(',').map((u) => u.trim()).filter(Boolean);
      }
    } else if (trimmed) {
      urls = [trimmed.replace(/["']/g, '').trim()];
    }
  }

  urls = urls.filter((u) => u && u.length > 5 && (u.startsWith('http://') || u.startsWith('https://')));

  return {
    primary: urls[0] || null,
    secondary: urls[1] || null,
    all: urls,
  };
}

/**
 * Filter raw product from TechPOS to only required fields for image syncing
 */
function filterProductForImageSync(item = {}, page = 1) {
  const id = item.id !== undefined && item.id !== null ? String(item.id).trim() : '';
  const sku = item.sku !== undefined && item.sku !== null ? String(item.sku).trim() : null;
  const name = item.name || item.displayName || null;
  const rawImages = item.imagesUrls || null;

  const { primary, secondary } = extractImageUrls(rawImages);

  let rawImagesString = null;
  if (rawImages) {
    rawImagesString = typeof rawImages === 'string' ? rawImages : JSON.stringify(rawImages);
  }

  return {
    id,
    sku,
    name,
    imageUrl: primary,
    secondImageUrl: secondary,
    raw_images_urls: rawImagesString,
    source_page: page,
  };
}

const ProductImageModel = {
  /**
   * Initialize / ensure table exists
   */
  async createTable() {
    await pool.query(PRODUCT_IMAGE_TABLE_SCHEMA);
  },

  /**
   * Bulk upsert lean image records into techpos_product_images
   */
  async bulkUpsert(items = [], chunkSize = 100) {
    if (!Array.isArray(items) || items.length === 0) return { insertedOrUpdated: 0 };

    // Deduplicate by id before batch insert
    const uniqueMap = new Map();
    for (const item of items) {
      if (item && item.id) {
        uniqueMap.set(String(item.id), item);
      }
    }

    const validItems = Array.from(uniqueMap.values());
    if (validItems.length === 0) return { insertedOrUpdated: 0 };

    const columns = ['id', 'sku', 'name', 'imageUrl', 'secondImageUrl', 'raw_images_urls', 'source_page'];
    const updateClauses = columns
      .filter((c) => c !== 'id')
      .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
      .join(', ');

    let processedCount = 0;

    for (let i = 0; i < validItems.length; i += chunkSize) {
      const chunk = validItems.slice(i, i + chunkSize);
      const rowPlaceholders = `(${columns.map(() => '?').join(', ')})`;
      const allPlaceholders = chunk.map(() => rowPlaceholders).join(', ');

      const values = [];
      for (const item of chunk) {
        for (const col of columns) {
          values.push(item[col] !== undefined ? item[col] : null);
        }
      }

      const sql = `
        INSERT INTO techpos_product_images (${columns.map((c) => `\`${c}\``).join(', ')})
        VALUES ${allPlaceholders}
        ON DUPLICATE KEY UPDATE ${updateClauses}
      `;

      await pool.query(sql, values);
      processedCount += chunk.length;
    }

    return { insertedOrUpdated: processedCount };
  },

  /**
   * Sync images from techpos_product_images into products table
   * Executes high-performance set-based JOIN updates
   */
  async syncToProductsTable() {
    // 1. Direct update matching on primary key (products.pk = techpos_product_images.id)
    const [pkResult] = await pool.query(`
      UPDATE products p
      INNER JOIN techpos_product_images t ON p.pk = t.id
      SET
        p.imageUrl = t.imageUrl,
        p.secondImageUrl = COALESCE(t.secondImageUrl, p.secondImageUrl)
      WHERE t.imageUrl IS NOT NULL AND t.imageUrl != ''
    `);

    // 2. Secondary fallback update matching on SKU (where pk was not matched and product has no image)
    const [skuResult] = await pool.query(`
      UPDATE products p
      INNER JOIN techpos_product_images t ON p.sku = t.sku
      SET
        p.imageUrl = t.imageUrl,
        p.secondImageUrl = COALESCE(t.secondImageUrl, p.secondImageUrl)
      WHERE (p.imageUrl IS NULL OR p.imageUrl = '')
        AND t.imageUrl IS NOT NULL AND t.imageUrl != ''
        AND p.sku IS NOT NULL AND p.sku != ''
    `);

    // 3. Count products with images in products table
    const [countResult] = await pool.query(`
      SELECT COUNT(*) as count FROM products WHERE imageUrl IS NOT NULL AND imageUrl != ''
    `);

    return {
      updatedByPk: pkResult.affectedRows || 0,
      updatedBySku: skuResult.affectedRows || 0,
      totalWithImagesInProducts: countResult[0]?.count || 0,
    };
  },

  /**
   * Total count of stored image records
   */
  async count() {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM techpos_product_images');
    return rows[0]?.total || 0;
  },

  /**
   * Count of records with valid non-null imageUrl
   */
  async countWithImages() {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as total FROM techpos_product_images WHERE imageUrl IS NOT NULL AND imageUrl != ""'
    );
    return rows[0]?.total || 0;
  },
};

module.exports = ProductImageModel;
module.exports.ProductImageModel = ProductImageModel;
module.exports.PRODUCT_IMAGE_TABLE_SCHEMA = PRODUCT_IMAGE_TABLE_SCHEMA;
module.exports.extractImageUrls = extractImageUrls;
module.exports.filterProductForImageSync = filterProductForImageSync;

