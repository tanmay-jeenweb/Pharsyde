const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Users Table Definition
 */
const USER_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    user_type VARCHAR(100) DEFAULT 'Staff',
    user_type_id INT DEFAULT NULL,
    mob_no VARCHAR(30) DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL,
    date_of_join DATE DEFAULT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_type_id (user_type_id),
    INDEX idx_user_active (active)
  )
`;

const UserModel = {
  /**
   * Initialize / verify users table and columns
   */
  async createTable() {
    await pool.query(USER_TABLE_SCHEMA);

    // Ensure columns exist if table was previously created with minimal schema
    const columnsToEnsure = [
      { name: 'username', query: 'ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL' },
      { name: 'user_type', query: "ALTER TABLE users ADD COLUMN user_type VARCHAR(100) DEFAULT 'Staff'" },
      { name: 'user_type_id', query: 'ALTER TABLE users ADD COLUMN user_type_id INT DEFAULT NULL' },
      { name: 'mob_no', query: 'ALTER TABLE users ADD COLUMN mob_no VARCHAR(30) DEFAULT NULL' },
      { name: 'date_of_birth', query: 'ALTER TABLE users ADD COLUMN date_of_birth DATE DEFAULT NULL' },
      { name: 'date_of_join', query: 'ALTER TABLE users ADD COLUMN date_of_join DATE DEFAULT NULL' },
      { name: 'active', query: 'ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT TRUE' }
    ];

    for (const col of columnsToEnsure) {
      try {
        const [rows] = await pool.query(`SHOW COLUMNS FROM users LIKE '${col.name}'`);
        if (rows.length === 0) {
          await pool.query(col.query);
        }
      } catch (err) {
        console.warn(`[UserModel] Column ensure (${col.name}):`, err.message);
      }
    }

    // Seed default Admin user if empty
    await this.seedDefaultAdmin();
  },

  /**
   * Seed default Admin user
   */
  async seedDefaultAdmin() {
    try {
      const [rows] = await pool.query('SELECT COUNT(*) as cnt FROM users');
      if (rows[0].cnt === 0) {
        // Fetch Admin user_type_id if available
        let adminTypeId = null;
        try {
          const [utRows] = await pool.query("SELECT id FROM user_types WHERE type_name = 'Admin' LIMIT 1");
          if (utRows.length > 0) adminTypeId = utRows[0].id;
        } catch {}

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('admin123', salt);

        await pool.query(`
          INSERT INTO users (name, username, email, password, role, user_type, user_type_id, active, date_of_join)
          VALUES (?, ?, ?, ?, 'admin', 'Admin', ?, 1, CURDATE())
        `, ['Administrator', 'admin', 'admin@pharsyde.com', hash, adminTypeId]);

        console.log('[UserModel] Seeded default Admin user: admin@pharsyde.com / admin123 (username: admin)');
      }
    } catch (err) {
      console.warn('[UserModel] Seed default admin warning:', err.message);
    }
  },

  /**
   * Find user by email
   */
  async findByEmail(email) {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },

  /**
   * Find user by username or email (for login flexibility)
   */
  async findByUsernameOrEmail(identifier) {
    const [rows] = await pool.query(
      `SELECT u.*, ut.type_name as user_group_name 
       FROM users u 
       LEFT JOIN user_types ut ON u.user_type_id = ut.id 
       WHERE u.email = ? OR u.username = ?`,
      [identifier, identifier]
    );
    return rows[0] || null;
  },

  /**
   * Find user by ID (excluding password)
   */
  async findById(id) {
    const [rows] = await pool.query(`
      SELECT 
        u.id, 
        u.name, 
        u.username, 
        u.email, 
        u.role, 
        u.user_type, 
        u.user_type_id, 
        u.mob_no, 
        u.date_of_birth, 
        u.date_of_join, 
        u.active, 
        u.created_at, 
        u.updated_at,
        ut.type_name as user_group_name
      FROM users u
      LEFT JOIN user_types ut ON u.user_type_id = ut.id
      WHERE u.id = ?
    `, [id]);
    return rows[0] || null;
  },

  /**
   * Create a new user
   */
  async create({ name, username, email, password, role = 'user', user_type = 'Staff', user_type_id = null, mob_no = null, date_of_birth = null, date_of_join = null, active = true }) {
    const [result] = await pool.query(`
      INSERT INTO users (name, username, email, password, role, user_type, user_type_id, mob_no, date_of_birth, date_of_join, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, username || null, email, password, role, user_type, user_type_id || null, mob_no || null, date_of_birth || null, date_of_join || null, active ? 1 : 0]);
    
    return this.findById(result.insertId);
  },

  /**
   * Update an existing user
   */
  async update(id, updates = {}) {
    const fields = [];
    const values = [];

    const allowed = ['name', 'username', 'email', 'password', 'role', 'user_type', 'user_type_id', 'mob_no', 'date_of_birth', 'date_of_join', 'active'];
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`\`${key}\` = ?`);
        values.push(updates[key]);
      }
    }

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id);
  },

  /**
   * Toggle user active status
   */
  async toggleActive(id, newState) {
    await pool.query('UPDATE users SET active = ? WHERE id = ?', [newState ? 1 : 0, id]);
    return this.findById(id);
  },

  /**
   * Delete user
   */
  async delete(id) {
    const [res] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return res.affectedRows > 0;
  },

  /**
   * Get all users for office management with filters
   */
  async findAllOffice({ showInactive = false, search = '', userTypeId = null } = {}) {
    let query = `
      SELECT 
        u.id, 
        u.name, 
        u.username, 
        u.email, 
        u.role, 
        u.user_type, 
        u.user_type_id, 
        u.mob_no, 
        u.date_of_birth, 
        u.date_of_join, 
        u.active, 
        u.created_at, 
        u.updated_at,
        ut.type_name as user_group_name
      FROM users u
      LEFT JOIN user_types ut ON u.user_type_id = ut.id
      WHERE 1=1
    `;
    const params = [];

    if (!showInactive) {
      query += ' AND u.active = 1';
    }

    if (userTypeId) {
      query += ' AND u.user_type_id = ?';
      params.push(userTypeId);
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ? OR u.mob_no LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    query += ' ORDER BY u.created_at DESC';

    const [rows] = await pool.query(query, params);
    return rows;
  },

  /**
   * Original basic findAll
   */
  async findAll() {
    return this.findAllOffice({ showInactive: true });
  },
};

module.exports = UserModel;
module.exports.UserModel = UserModel;
module.exports.USER_TABLE_SCHEMA = USER_TABLE_SCHEMA;
