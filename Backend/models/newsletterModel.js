const pool = require('../config/db');

const NewsletterModel = {
  /**
   * Create newsletter_subscriptions table if it doesn't exist
   */
  async createTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        consent TINYINT(1) NOT NULL DEFAULT 1,
        status VARCHAR(50) NOT NULL DEFAULT 'subscribed',
        source VARCHAR(100) DEFAULT 'homepage',
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nl_status (status),
        INDEX idx_nl_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },

  /**
   * Subscribe an email. Handles new subscriptions as well as re-activating previous unsubscribers.
   */
  async subscribe({ email, consent = true, source = 'homepage', ipAddress = null }) {
    const cleanEmail = email.trim().toLowerCase();
    const consentVal = consent ? 1 : 0;

    const [result] = await pool.query(
      `INSERT INTO newsletter_subscriptions (email, consent, status, source, ip_address)
       VALUES (?, ?, 'subscribed', ?, ?)
       ON DUPLICATE KEY UPDATE 
         status = 'subscribed',
         consent = VALUES(consent),
         source = VALUES(source),
         ip_address = VALUES(ip_address),
         updated_at = CURRENT_TIMESTAMP`,
      [cleanEmail, consentVal, source, ipAddress]
    );

    // affectedRows: 1 = inserted, 2 = updated, 0 = no change
    const isNew = result.affectedRows === 1;

    const [rows] = await pool.query('SELECT * FROM newsletter_subscriptions WHERE email = ?', [cleanEmail]);
    return {
      subscriber: rows[0],
      isNew
    };
  },

  /**
   * Find subscriber by ID
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM newsletter_subscriptions WHERE id = ?', [id]);
    return rows[0] || null;
  },

  /**
   * Find subscriber by email
   */
  async findByEmail(email) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const [rows] = await pool.query('SELECT * FROM newsletter_subscriptions WHERE email = ?', [cleanEmail]);
    return rows[0] || null;
  },

  /**
   * Find all newsletter subscribers with search, status filtering, and pagination
   */
  async findAll({ search = '', status = 'all', page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      conditions.push('(email LIKE ? OR source LIKE ?)');
      params.push(term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM newsletter_subscriptions ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Allowed sort columns
    const allowedSortColumns = ['id', 'email', 'status', 'source', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const safeLimit = Math.max(1, Math.min(500, Number(limit) || 50));
    const safeOffset = Math.max(0, ((Number(page) || 1) - 1) * safeLimit);

    const [rows] = await pool.query(
      `SELECT * FROM newsletter_subscriptions ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`,
      [...params, safeLimit, safeOffset]
    );

    return {
      subscribers: rows,
      total,
      page: Number(page) || 1,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1
    };
  },

  /**
   * Update subscriber status ('subscribed' or 'unsubscribed')
   */
  async updateStatus(id, status) {
    const [res] = await pool.query(
      'UPDATE newsletter_subscriptions SET status = ? WHERE id = ?',
      [status, id]
    );
    return res.affectedRows > 0;
  },

  /**
   * Delete subscriber
   */
  async delete(id) {
    const [res] = await pool.query('DELETE FROM newsletter_subscriptions WHERE id = ?', [id]);
    return res.affectedRows > 0;
  },

  /**
   * Get aggregate statistics for dashboard
   */
  async getStats() {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'subscribed' THEN 1 ELSE 0 END) as subscribed,
        SUM(CASE WHEN status = 'unsubscribed' THEN 1 ELSE 0 END) as unsubscribed,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today
      FROM newsletter_subscriptions
    `);
    const r = rows[0] || {};
    return {
      total: Number(r.total) || 0,
      subscribed: Number(r.subscribed) || 0,
      unsubscribed: Number(r.unsubscribed) || 0,
      today: Number(r.today) || 0
    };
  }
};

module.exports = NewsletterModel;

