const pool = require('../config/db');

const ContactInquiryModel = {
  /**
   * Create contact_inquiries table if it doesn't exist
   */
  async createTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_inquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        subject VARCHAR(255) NOT NULL DEFAULT 'General Inquiry',
        message TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'new',
        admin_notes TEXT NULL,
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_email (email),
        INDEX idx_created (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  },

  /**
   * Insert a new contact inquiry
   */
  async create({ name, email, phone = null, subject = 'General Inquiry', message, ipAddress = null }) {
    const [result] = await pool.query(
      `INSERT INTO contact_inquiries (name, email, phone, subject, message, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name.trim(), email.trim().toLowerCase(), phone ? phone.trim() : null, subject.trim(), message.trim(), ipAddress]
    );
    return {
      id: result.insertId,
      name,
      email,
      phone,
      subject,
      message,
      status: 'new',
      ip_address: ipAddress,
      created_at: new Date()
    };
  },

  /**
   * Find inquiry by ID
   */
  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM contact_inquiries WHERE id = ?', [id]);
    return rows[0] || null;
  },

  /**
   * Find all inquiries with optional search, status filtering, and pagination
   */
  async findAll({ search = '', status = 'all', page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'DESC' } = {}) {
    const conditions = [];
    const params = [];

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      conditions.push('(name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ?)');
      params.push(term, term, term, term, term);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching
    const [countRows] = await pool.query(
      `SELECT COUNT(*) as total FROM contact_inquiries ${whereClause}`,
      params
    );
    const total = countRows[0]?.total || 0;

    // Allowed sort columns
    const allowedSortColumns = ['id', 'name', 'email', 'subject', 'status', 'created_at'];
    const safeSortBy = allowedSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const safeSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 50));
    const safeOffset = Math.max(0, ((Number(page) || 1) - 1) * safeLimit);

    const [rows] = await pool.query(
      `SELECT * FROM contact_inquiries ${whereClause} ORDER BY ${safeSortBy} ${safeSortOrder} LIMIT ? OFFSET ?`,
      [...params, safeLimit, safeOffset]
    );

    return {
      inquiries: rows,
      total,
      page: Number(page) || 1,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1
    };
  },

  /**
   * Update inquiry status and admin notes
   */
  async updateStatus(id, { status, adminNotes }) {
    const updates = [];
    const params = [];

    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }
    if (adminNotes !== undefined) {
      updates.push('admin_notes = ?');
      params.push(adminNotes);
    }

    if (updates.length === 0) return false;

    params.push(id);
    const [res] = await pool.query(
      `UPDATE contact_inquiries SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
    return res.affectedRows > 0;
  },

  /**
   * Delete inquiry
   */
  async delete(id) {
    const [res] = await pool.query('DELETE FROM contact_inquiries WHERE id = ?', [id]);
    return res.affectedRows > 0;
  },

  /**
   * Get aggregate statistics for dashboard
   */
  async getStats() {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as \`new\`,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN status = 'spam' THEN 1 ELSE 0 END) as spam
      FROM contact_inquiries
    `);
    const r = rows[0] || {};
    return {
      total: Number(r.total) || 0,
      new: Number(r.new) || 0,
      inProgress: Number(r.in_progress) || 0,
      resolved: Number(r.resolved) || 0,
      spam: Number(r.spam) || 0
    };
  }
};

module.exports = ContactInquiryModel;

