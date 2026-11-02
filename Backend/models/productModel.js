const pool = require('../config/db');

/**
 * Products Table Definition matching POS inventory schema
 */
const PRODUCT_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS products (
    pk VARCHAR(50) PRIMARY KEY,
    active BOOLEAN DEFAULT TRUE,
    modified VARCHAR(50) NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NULL,
    category VARCHAR(100) NULL,
    subCategory VARCHAR(100) NULL,
    subsubCategory VARCHAR(100) NULL,
    other_category VARCHAR(100) NULL,
    size VARCHAR(50) NULL,
    cost DECIMAL(10, 2) NULL,
    retail_price VARCHAR(50) NULL,
    membership_price VARCHAR(50) NULL,
    premium_membership_price VARCHAR(50) DEFAULT 'N.A.',
    inventoried BOOLEAN DEFAULT TRUE,
    taxable BOOLEAN DEFAULT FALSE,
    discountable BOOLEAN DEFAULT FALSE,
    sale_price VARCHAR(50) DEFAULT 'N.A.',
    default_units_per_case DECIMAL(10, 2) NULL,
    qty_available DECIMAL(10, 3) DEFAULT 0.000,
    equivalent_g DECIMAL(10, 2) NULL,
    thC_Range VARCHAR(100) NULL,
    cbD_Range VARCHAR(100) NULL,
    thC_LEVEL DECIMAL(6, 2) NULL,
    cbD_LEVEL DECIMAL(6, 2) NULL,
    supplier VARCHAR(150) NULL,
    sub_supplier VARCHAR(150) NULL,
    long_description TEXT NULL,
    imageUrl VARCHAR(500) NULL,
    secondImageUrl VARCHAR(500) NULL,
    web_name VARCHAR(255) NULL,
    brand VARCHAR(100) NULL,
    barcode VARCHAR(100) NULL,
    storeId INT DEFAULT 1,
    strain VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_brand (brand),
    INDEX idx_sku (sku),
    INDEX idx_barcode (barcode)
  )
`;

// All product column definitions
const PRODUCT_COLUMNS = [
  'pk',
  'active',
  'modified',
  'product_name',
  'sku',
  'category',
  'subCategory',
  'subsubCategory',
  'other_category',
  'size',
  'cost',
  'retail_price',
  'membership_price',
  'premium_membership_price',
  'inventoried',
  'taxable',
  'discountable',
  'sale_price',
  'default_units_per_case',
  'qty_available',
  'equivalent_g',
  'thC_Range',
  'cbD_Range',
  'thC_LEVEL',
  'cbD_LEVEL',
  'supplier',
  'sub_supplier',
  'long_description',
  'imageUrl',
  'secondImageUrl',
  'web_name',
  'brand',
  'barcode',
  'storeId',
  'strain'
];

/**
 * Sanitize and extract product data matching table columns
 */
const extractProductData = (data = {}) => {
  return {
    pk: String(data.pk ?? ''),
    active: data.active !== undefined ? Boolean(data.active) : true,
    modified: data.modified || new Date().toISOString(),
    product_name: data.product_name || '',
    sku: data.sku ?? null,
    category: data.category ?? null,
    subCategory: data.subCategory ?? null,
    subsubCategory: data.subsubCategory ?? null,
    other_category: data.other_category ?? null,
    size: data.size !== undefined && data.size !== null ? String(data.size) : '',
    cost: data.cost !== undefined && data.cost !== null && !isNaN(Number(data.cost)) ? Number(data.cost) : null,
    retail_price: data.retail_price !== undefined && data.retail_price !== null ? String(data.retail_price) : null,
    membership_price: data.membership_price !== undefined && data.membership_price !== null ? String(data.membership_price) : null,
    premium_membership_price: data.premium_membership_price !== undefined && data.premium_membership_price !== null ? String(data.premium_membership_price) : 'N.A.',
    inventoried: data.inventoried !== undefined ? Boolean(data.inventoried) : true,
    taxable: data.taxable !== undefined ? Boolean(data.taxable) : false,
    discountable: data.discountable !== undefined ? Boolean(data.discountable) : false,
    sale_price: data.sale_price !== undefined && data.sale_price !== null ? String(data.sale_price) : 'N.A.',
    default_units_per_case: data.default_units_per_case !== undefined && data.default_units_per_case !== null && !isNaN(Number(data.default_units_per_case)) ? Number(data.default_units_per_case) : null,
    qty_available: data.qty_available !== undefined && data.qty_available !== null && !isNaN(Number(data.qty_available)) ? Number(data.qty_available) : 0,
    equivalent_g: data.equivalent_g !== undefined && data.equivalent_g !== null && !isNaN(Number(data.equivalent_g)) ? Number(data.equivalent_g) : null,
    thC_Range: data.thC_Range !== undefined && data.thC_Range !== null ? String(data.thC_Range) : null,
    cbD_Range: data.cbD_Range !== undefined && data.cbD_Range !== null ? String(data.cbD_Range) : null,
    thC_LEVEL: data.thC_LEVEL !== undefined && data.thC_LEVEL !== null && !isNaN(Number(data.thC_LEVEL)) ? Number(data.thC_LEVEL) : null,
    cbD_LEVEL: data.cbD_LEVEL !== undefined && data.cbD_LEVEL !== null && !isNaN(Number(data.cbD_LEVEL)) ? Number(data.cbD_LEVEL) : null,
    supplier: data.supplier !== undefined && data.supplier !== null ? String(data.supplier) : null,
    sub_supplier: data.sub_supplier !== undefined && data.sub_supplier !== null ? String(data.sub_supplier) : null,
    long_description: data.long_description !== undefined && data.long_description !== null ? String(data.long_description) : null,
    imageUrl: data.imageUrl !== undefined && data.imageUrl !== null ? String(data.imageUrl) : null,
    secondImageUrl: data.secondImageUrl !== undefined && data.secondImageUrl !== null ? String(data.secondImageUrl) : null,
    web_name: data.web_name !== undefined && data.web_name !== null ? String(data.web_name) : null,
    brand: data.brand !== undefined && data.brand !== null ? String(data.brand) : null,
    barcode: data.barcode !== undefined && data.barcode !== null ? String(data.barcode) : null,
    storeId: data.storeId !== undefined && data.storeId !== null && !isNaN(Number(data.storeId)) ? Number(data.storeId) : 1,
    strain: data.strain !== undefined && data.strain !== null ? String(data.strain) : null
  };
};

const ProductModel = {
  /**
   * Initialize / verify products table
   */
  async createTable() {
    await pool.query(PRODUCT_TABLE_SCHEMA);
  },

  /**
   * Get all products with filtering, search, pagination, and sorting
   */
  async findAll({
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
  } = {}) {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (active !== undefined) {
      query += ' AND active = ?';
      params.push(active === 'true' || active === true ? 1 : 0);
    }

    if (hasImage === 'true' || hasImage === true) {
      query += ' AND imageUrl IS NOT NULL AND imageUrl != "" AND imageUrl != "[]"';
    }

    if (category) {
      const categories = Array.isArray(category)
        ? category
        : (typeof category === 'string' && category.includes(',')
            ? category.split(',').map((c) => c.trim()).filter(Boolean)
            : [category]);

      if (categories.length === 1) {
        query += ' AND category = ?';
        params.push(categories[0]);
      } else if (categories.length > 1) {
        query += ` AND category IN (${categories.map(() => '?').join(', ')})`;
        params.push(...categories);
      }
    }

    if (subCategory) {
      query += ' AND subCategory = ?';
      params.push(subCategory);
    }

    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }

    if (strain) {
      query += ' AND strain = ?';
      params.push(strain);
    }

    if (storeId !== undefined) {
      query += ' AND storeId = ?';
      params.push(Number(storeId));
    }

    if (search) {
      query += ' AND (product_name LIKE ? OR brand LIKE ? OR sku LIKE ? OR barcode LIKE ? OR long_description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term, term);
    }

    // Safe sorting whitelist
    const allowedSortFields = ['modified', 'product_name', 'retail_price', 'cost', 'qty_available', 'brand', 'pk'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'modified';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY \`${safeSortBy}\` ${safeSortOrder} LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(query, params);
    return rows;
  },

  /**
   * Count products matching filters
   */
  async count({ category, brand, active, hasImage, search, storeId } = {}) {
    let query = 'SELECT COUNT(*) as total FROM products WHERE 1=1';
    const params = [];

    if (active !== undefined) {
      query += ' AND active = ?';
      params.push(active === 'true' || active === true ? 1 : 0);
    }

    if (hasImage === 'true' || hasImage === true) {
      query += ' AND imageUrl IS NOT NULL AND imageUrl != "" AND imageUrl != "[]"';
    }

    if (category) {
      const categories = Array.isArray(category)
        ? category
        : (typeof category === 'string' && category.includes(',')
            ? category.split(',').map((c) => c.trim()).filter(Boolean)
            : [category]);

      if (categories.length === 1) {
        query += ' AND category = ?';
        params.push(categories[0]);
      } else if (categories.length > 1) {
        query += ` AND category IN (${categories.map(() => '?').join(', ')})`;
        params.push(...categories);
      }
    }

    if (brand) {
      query += ' AND brand = ?';
      params.push(brand);
    }

    if (storeId !== undefined) {
      query += ' AND storeId = ?';
      params.push(Number(storeId));
    }

    if (search) {
      query += ' AND (product_name LIKE ? OR brand LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    const [rows] = await pool.query(query, params);
    return rows[0]?.total || 0;
  },

  /**
   * Find product by primary key pk
   */
  async findByPk(pk) {
    const [rows] = await pool.query('SELECT * FROM products WHERE pk = ?', [String(pk)]);
    return rows[0] || null;
  },

  /**
   * Alias for findByPk (compatible with generic id param)
   */
  async findById(id) {
    return this.findByPk(id);
  },

  /**
   * Find product by SKU
   */
  async findBySku(sku) {
    const [rows] = await pool.query('SELECT * FROM products WHERE sku = ?', [String(sku)]);
    return rows[0] || null;
  },

  /**
   * Find product by Barcode
   */
  async findByBarcode(barcode) {
    const [rows] = await pool.query('SELECT * FROM products WHERE barcode = ?', [String(barcode)]);
    return rows[0] || null;
  },

  /**
   * Create a single product
   */
  async create(data) {
    const item = extractProductData(data);
    const columns = PRODUCT_COLUMNS;
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map((col) => item[col]);

    const sql = `INSERT INTO products (${columns.map((c) => `\`${c}\``).join(', ')}) VALUES (${placeholders})`;
    await pool.query(sql, values);

    return this.findByPk(item.pk);
  },

  /**
   * Upsert a product (Insert or Update on duplicate pk)
   */
  async upsert(data) {
    const item = extractProductData(data);
    const columns = PRODUCT_COLUMNS;
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map((col) => item[col]);

    const updateClauses = columns
      .filter((c) => c !== 'pk')
      .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
      .join(', ');

    const sql = `
      INSERT INTO products (${columns.map((c) => `\`${c}\``).join(', ')})
      VALUES (${placeholders})
      ON DUPLICATE KEY UPDATE ${updateClauses}
    `;

    await pool.query(sql, values);
    return this.findByPk(item.pk);
  },

  /**
   * High-performance Bulk Upsert using chunked batch queries
   */
  async bulkUpsert(items = [], chunkSize = 100) {
    if (!Array.isArray(items) || items.length === 0) return { insertedOrUpdated: 0 };

    // Deduplicate by pk before inserting to avoid intra-batch duplicate key errors
    const uniqueMap = new Map();
    for (const item of items) {
      if (item && item.pk) {
        uniqueMap.set(String(item.pk), item);
      }
    }
    const validItems = Array.from(uniqueMap.values());
    if (validItems.length === 0) return { insertedOrUpdated: 0 };

    const columns = PRODUCT_COLUMNS;
    const updateClauses = columns
      .filter((c) => c !== 'pk')
      .map((c) => `\`${c}\` = VALUES(\`${c}\`)`)
      .join(', ');

    let processedCount = 0;

    for (let i = 0; i < validItems.length; i += chunkSize) {
      const chunk = validItems.slice(i, i + chunkSize).map(extractProductData);
      const rowPlaceholders = `(${columns.map(() => '?').join(', ')})`;
      const allPlaceholders = chunk.map(() => rowPlaceholders).join(', ');

      const values = [];
      for (const item of chunk) {
        for (const col of columns) {
          values.push(item[col]);
        }
      }

      const sql = `
        INSERT INTO products (${columns.map((c) => `\`${c}\``).join(', ')})
        VALUES ${allPlaceholders}
        ON DUPLICATE KEY UPDATE ${updateClauses}
      `;

      await pool.query(sql, values);
      processedCount += chunk.length;
    }

    return { insertedOrUpdated: processedCount };
  },

  /**
   * Update product by pk
   */
  async update(pk, data) {
    const fields = [];
    const values = [];

    for (const col of PRODUCT_COLUMNS) {
      if (col !== 'pk' && data[col] !== undefined) {
        fields.push(`\`${col}\` = ?`);
        values.push(data[col]);
      }
    }

    if (fields.length === 0) return this.findByPk(pk);

    values.push(String(pk));
    await pool.query(`UPDATE products SET ${fields.join(', ')} WHERE pk = ?`, values);
    return this.findByPk(pk);
  },

  /**
   * Delete product by pk
   */
  async delete(pk) {
    const [result] = await pool.query('DELETE FROM products WHERE pk = ?', [String(pk)]);
    return result.affectedRows > 0;
  },

  /**
   * Get distinct categories
   */
  async getCategories({ hasImage } = {}) {
    let query = 'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category != ""';
    if (hasImage === 'true' || hasImage === true) {
      query += ' AND imageUrl IS NOT NULL AND imageUrl != "" AND imageUrl != "[]"';
    }
    query += ' ORDER BY category ASC';
    const [rows] = await pool.query(query);
    return rows.map((r) => r.category);
  },

  /**
   * Get distinct brands
   */
  async getBrands() {
    const [rows] = await pool.query('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL ORDER BY brand ASC');
    return rows.map((r) => r.brand);
  }
};

module.exports = ProductModel;
module.exports.ProductModel = ProductModel;
module.exports.PRODUCT_TABLE_SCHEMA = PRODUCT_TABLE_SCHEMA;
module.exports.PRODUCT_COLUMNS = PRODUCT_COLUMNS;
module.exports.extractProductData = extractProductData;
