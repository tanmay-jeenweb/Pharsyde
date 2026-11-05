const pool = require('../config/db');

const AuditLogModel = {
  /**
   * Create audit_logs table
   */
  async createTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT DEFAULT NULL,
        username VARCHAR(255) DEFAULT NULL,
        master_name VARCHAR(100) NOT NULL,
        change_type VARCHAR(50) NOT NULL,
        before_data LONGTEXT NULL,
        after_data LONGTEXT NULL,
        ip_address VARCHAR(50) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_master (master_name),
        INDEX idx_type (change_type),
        INDEX idx_created (created_at)
      )
    `);
  },

  /**
   * Log an activity / change
   */
  async log({
    userId = null,
    username = null,
    masterName,
    changeType,
    beforeData = null,
    afterData = null,
    ipAddress = null
  }) {
    try {
      const beforeStr = beforeData ? (typeof beforeData === 'string' ? beforeData : JSON.stringify(beforeData)) : null;
      const afterStr = afterData ? (typeof afterData === 'string' ? afterData : JSON.stringify(afterData)) : null;

      const [res] = await pool.query(`
        INSERT INTO audit_logs (user_id, username, master_name, change_type, before_data, after_data, ip_address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [userId, username, masterName, changeType, beforeStr, afterStr, ipAddress]);
      return res.insertId;
    } catch (err) {
      console.error('[AuditLogModel] Error recording log:', err.message);
      return null;
    }
  },

  /**
   * Helper to log action directly from Express req object
   */
  async logAction(req = {}, { action = 'UPDATE', masterName, recordId = null, details = null, beforeData = null, afterData = null } = {}) {
    return this.log({
      userId: req?.user?.id || null,
      username: req?.user?.name || req?.user?.username || req?.user?.email || 'admin',
      masterName: masterName || 'system',
      changeType: action,
      beforeData: beforeData || null,
      afterData: afterData || (details ? { recordId, ...details } : { recordId }),
      ipAddress: req?.ip || req?.connection?.remoteAddress || null,
    });
  },

  /**
   * Find all audit logs with optional filters
   */
  async findAll({ masterName, changeType, search, limit = 100, offset = 0 } = {}) {
    let query = `
      SELECT id, user_id, username, master_name, change_type, before_data, after_data, ip_address, created_at
      FROM audit_logs
      WHERE 1=1
    `;
    const params = [];

    if (masterName && masterName !== 'all') {
      query += ' AND master_name = ?';
      params.push(masterName);
    }

    if (changeType && changeType !== 'all') {
      query += ' AND change_type = ?';
      params.push(changeType);
    }

    if (search) {
      query += ' AND (username LIKE ? OR master_name LIKE ? OR change_type LIKE ? OR before_data LIKE ? OR after_data LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit) || 100, Number(offset) || 0);

    const [rows] = await pool.query(query, params);

    return rows.map(r => {
      let before = null;
      let after = null;
      try {
        if (r.before_data) before = JSON.parse(r.before_data);
      } catch {
        before = r.before_data;
      }
      try {
        if (r.after_data) after = JSON.parse(r.after_data);
      } catch {
        after = r.after_data;
      }
      return {
        ...r,
        before_data: before,
        after_data: after
      };
    });
  },

  /**
   * Get distinct masters count / summary
   */
  async getSummary() {
    const [totalRows] = await pool.query('SELECT COUNT(*) as total FROM audit_logs');
    const [byType] = await pool.query('SELECT change_type, COUNT(*) as count FROM audit_logs GROUP BY change_type');
    const [byMaster] = await pool.query('SELECT master_name, COUNT(*) as count FROM audit_logs GROUP BY master_name');

    return {
      total: totalRows[0]?.total || 0,
      byType,
      byMaster
    };
  }
};

module.exports = AuditLogModel;

