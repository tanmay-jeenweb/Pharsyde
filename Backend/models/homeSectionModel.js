const pool = require('../config/db');

const HomeSectionModel = {
  /**
   * Create home_sections table if it does not exist
   */
  async createTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS home_sections (
        id INT AUTO_INCREMENT PRIMARY KEY,
        heading VARCHAR(255) NOT NULL,
        sub_heading TEXT NULL,
        product_ids JSON NOT NULL,
        display_order INT NOT NULL DEFAULT 0,
        active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_active_order (active, display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },

  /**
   * Find all sections ordered by display_order ASC, id ASC
   * @param {Object} options
   * @param {boolean} options.activeOnly
   */
  async findAll({ activeOnly = false } = {}) {
    let query = 'SELECT * FROM home_sections';
    const params = [];

    if (activeOnly) {
      query += ' WHERE active = 1';
    }

    query += ' ORDER BY display_order ASC, id ASC';

    const [rows] = await pool.query(query, params);
    return rows.map(this.normalizeRow);
  },

  /**
   * Find single section by ID
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM home_sections WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return this.normalizeRow(rows[0]);
  },

  /**
   * Get the next display order (MAX(display_order) + 1)
   */
  async getNextDisplayOrder() {
    const [rows] = await pool.query('SELECT MAX(display_order) as maxOrder FROM home_sections');
    const maxOrder = rows[0]?.maxOrder;
    return (maxOrder !== null && maxOrder !== undefined) ? Number(maxOrder) + 1 : 1;
  },

  /**
   * Create a new home section
   */
  async create({ heading, sub_heading = '', product_ids = [], display_order = null, active = 1 }) {
    let orderToSet = display_order;
    if (orderToSet === null || orderToSet === undefined || isNaN(orderToSet)) {
      orderToSet = await this.getNextDisplayOrder();
    }

    const safeProductIds = Array.isArray(product_ids)
      ? JSON.stringify(product_ids)
      : (typeof product_ids === 'string' ? product_ids : '[]');

    const [result] = await pool.query(
      `INSERT INTO home_sections (heading, sub_heading, product_ids, display_order, active)
       VALUES (?, ?, ?, ?, ?)`,
      [heading.trim(), sub_heading ? sub_heading.trim() : null, safeProductIds, Number(orderToSet), active ? 1 : 0]
    );

    return this.findById(result.insertId);
  },

  /**
   * Update an existing home section
   */
  async update(id, { heading, sub_heading, product_ids, display_order, active }) {
    const fields = [];
    const params = [];

    if (heading !== undefined) {
      fields.push('heading = ?');
      params.push(heading.trim());
    }
    if (sub_heading !== undefined) {
      fields.push('sub_heading = ?');
      params.push(sub_heading ? sub_heading.trim() : null);
    }
    if (product_ids !== undefined) {
      fields.push('product_ids = ?');
      const safeProductIds = Array.isArray(product_ids)
        ? JSON.stringify(product_ids)
        : (typeof product_ids === 'string' ? product_ids : '[]');
      params.push(safeProductIds);
    }
    if (display_order !== undefined) {
      fields.push('display_order = ?');
      params.push(Number(display_order));
    }
    if (active !== undefined) {
      fields.push('active = ?');
      params.push(active ? 1 : 0);
    }

    if (fields.length === 0) return this.findById(id);

    params.push(id);
    await pool.query(`UPDATE home_sections SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  /**
   * Toggle active state
   */
  async toggleActive(id) {
    const existing = await this.findById(id);
    if (!existing) return null;
    const newActive = existing.active ? 0 : 1;
    await pool.query('UPDATE home_sections SET active = ? WHERE id = ?', [newActive, id]);
    return this.findById(id);
  },

  /**
   * Delete a home section by ID
   */
  async delete(id) {
    const [result] = await pool.query('DELETE FROM home_sections WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  /**
   * Batch update display orders for an array of ordered section IDs or objects
   * @param {Array<number|string|{id: number|string, display_order: number}>} orderList
   */
  async reorder(orderList = []) {
    if (!Array.isArray(orderList) || orderList.length === 0) return;

    for (let i = 0; i < orderList.length; i++) {
      const item = orderList[i];
      const sectionId = typeof item === 'object' && item !== null ? item.id : item;
      const order = typeof item === 'object' && item !== null && item.display_order !== undefined ? item.display_order : i + 1;
      await pool.query('UPDATE home_sections SET display_order = ? WHERE id = ?', [Number(order), sectionId]);
    }
  },

  /**
   * Parse product_ids JSON safely
   */
  normalizeRow(row) {
    if (!row) return null;
    let productIds = [];
    try {
      if (typeof row.product_ids === 'string') {
        productIds = JSON.parse(row.product_ids);
      } else if (Array.isArray(row.product_ids)) {
        productIds = row.product_ids;
      }
    } catch {
      productIds = [];
    }

    return {
      ...row,
      product_ids: Array.isArray(productIds) ? productIds : [],
      active: Boolean(row.active),
      display_order: Number(row.display_order || 0),
    };
  },
};

module.exports = HomeSectionModel;

