const pool = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Users Table Definition
 */
const USER_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) DEFAULT NULL,
    last_name VARCHAR(100) DEFAULT NULL,
    username VARCHAR(100) NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    user_type VARCHAR(100) DEFAULT 'Staff',
    user_type_id INT DEFAULT NULL,
    mob_no VARCHAR(30) DEFAULT NULL,
    date_of_birth DATE DEFAULT NULL,
    date_of_join DATE DEFAULT NULL,
    techpos_member_id INT DEFAULT NULL,
    elite_member_start_date DATETIME DEFAULT NULL,
    elite_member_end_date DATETIME DEFAULT NULL,
    techpos_sync_status VARCHAR(50) DEFAULT 'pending',
    techpos_last_synced_at DATETIME DEFAULT NULL,
    password_set BOOLEAN DEFAULT TRUE,
    reward_points DECIMAL(10,2) DEFAULT 0.00,
    reward_points_dollar_value DECIMAL(10,2) DEFAULT 0.00,
    card_number VARCHAR(100) DEFAULT NULL,
    is_elite BOOLEAN DEFAULT FALSE,
    visit_count INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_type_id (user_type_id),
    INDEX idx_user_active (active),
    INDEX idx_techpos_member_id (techpos_member_id)
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
      { name: 'active', query: 'ALTER TABLE users ADD COLUMN active BOOLEAN DEFAULT TRUE' },
      { name: 'first_name', query: 'ALTER TABLE users ADD COLUMN first_name VARCHAR(100) DEFAULT NULL' },
      { name: 'last_name', query: 'ALTER TABLE users ADD COLUMN last_name VARCHAR(100) DEFAULT NULL' },
      { name: 'techpos_member_id', query: 'ALTER TABLE users ADD COLUMN techpos_member_id INT DEFAULT NULL, ADD INDEX idx_techpos_member_id (techpos_member_id)' },
      { name: 'elite_member_start_date', query: 'ALTER TABLE users ADD COLUMN elite_member_start_date DATETIME DEFAULT NULL' },
      { name: 'elite_member_end_date', query: 'ALTER TABLE users ADD COLUMN elite_member_end_date DATETIME DEFAULT NULL' },
      { name: 'techpos_sync_status', query: "ALTER TABLE users ADD COLUMN techpos_sync_status VARCHAR(50) DEFAULT 'pending'" },
      { name: 'techpos_last_synced_at', query: 'ALTER TABLE users ADD COLUMN techpos_last_synced_at DATETIME DEFAULT NULL' },
      { name: 'password_set', query: 'ALTER TABLE users ADD COLUMN password_set BOOLEAN DEFAULT TRUE' },
      { name: 'reward_points', query: 'ALTER TABLE users ADD COLUMN reward_points DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'reward_points_dollar_value', query: 'ALTER TABLE users ADD COLUMN reward_points_dollar_value DECIMAL(10,2) DEFAULT 0.00' },
      { name: 'card_number', query: 'ALTER TABLE users ADD COLUMN card_number VARCHAR(100) DEFAULT NULL' },
      { name: 'is_elite', query: 'ALTER TABLE users ADD COLUMN is_elite BOOLEAN DEFAULT FALSE' },
      { name: 'visit_count', query: 'ALTER TABLE users ADD COLUMN visit_count INT DEFAULT 0' },
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
          INSERT INTO users (name, username, email, password, role, user_type, user_type_id, active, date_of_join, password_set)
          VALUES (?, ?, ?, ?, 'admin', 'Admin', ?, 1, CURDATE(), 1)
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
   * Find user by phone number (mob_no)
   */
  async findByPhone(phone) {
    if (!phone) return null;
    const cleanPhone = String(phone).replace(/\D/g, '');
    const [rows] = await pool.query(
      `SELECT * FROM users WHERE mob_no = ? OR REPLACE(REPLACE(REPLACE(REPLACE(mob_no, '-', ''), ' ', ''), '(', ''), ')', '') = ?`,
      [phone, cleanPhone]
    );
    return rows[0] || null;
  },

  /**
   * Find user by TechPOS Member ID
   */
  async findByTechPOSMemberId(memberId) {
    if (!memberId) return null;
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE techpos_member_id = ?',
      [Number(memberId)]
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
        u.first_name,
        u.last_name,
        u.username, 
        u.email, 
        u.role, 
        u.user_type, 
        u.user_type_id, 
        u.mob_no, 
        u.date_of_birth, 
        u.date_of_join, 
        u.techpos_member_id,
        u.elite_member_start_date,
        u.elite_member_end_date,
        u.techpos_sync_status,
        u.techpos_last_synced_at,
        u.password_set,
        u.reward_points,
        u.reward_points_dollar_value,
        u.card_number,
        u.is_elite,
        u.visit_count,
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
  async create({
    name,
    first_name = null,
    last_name = null,
    username = null,
    email,
    password,
    role = 'user',
    user_type = 'Staff',
    user_type_id = null,
    mob_no = null,
    date_of_birth = null,
    date_of_join = null,
    techpos_member_id = null,
    elite_member_start_date = null,
    elite_member_end_date = null,
    techpos_sync_status = 'pending',
    techpos_last_synced_at = null,
    password_set = true,
    reward_points = 0.00,
    reward_points_dollar_value = 0.00,
    card_number = null,
    is_elite = false,
    visit_count = 0,
    active = true,
  }) {
    // Derive name from first_name and last_name if not provided
    const fullName = name || [first_name, last_name].filter(Boolean).join(' ') || 'Customer';

    const [result] = await pool.query(`
      INSERT INTO users (
        name, first_name, last_name, username, email, password, role, user_type, user_type_id,
        mob_no, date_of_birth, date_of_join, techpos_member_id, elite_member_start_date,
        elite_member_end_date, techpos_sync_status, techpos_last_synced_at, password_set,
        reward_points, reward_points_dollar_value, card_number, is_elite, visit_count, active
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      fullName,
      first_name || null,
      last_name || null,
      username || null,
      email,
      password,
      role,
      user_type,
      user_type_id || null,
      mob_no || null,
      date_of_birth || null,
      date_of_join || null,
      techpos_member_id || null,
      elite_member_start_date || null,
      elite_member_end_date || null,
      techpos_sync_status || 'pending',
      techpos_last_synced_at || null,
      password_set ? 1 : 0,
      Number(reward_points) || 0.00,
      Number(reward_points_dollar_value) || 0.00,
      card_number || null,
      is_elite ? 1 : 0,
      Number(visit_count) || 0,
      active ? 1 : 0,
    ]);

    return this.findById(result.insertId);
  },

  /**
   * Update an existing user
   */
  async update(id, updates = {}) {
    const fields = [];
    const values = [];

    const allowed = [
      'name', 'first_name', 'last_name', 'username', 'email', 'password',
      'role', 'user_type', 'user_type_id', 'mob_no', 'date_of_birth', 'date_of_join',
      'techpos_member_id', 'elite_member_start_date', 'elite_member_end_date',
      'techpos_sync_status', 'techpos_last_synced_at', 'password_set',
      'reward_points', 'reward_points_dollar_value', 'card_number', 'is_elite', 'visit_count',
      'active'
    ];

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
   * Deduct reward points locally when redeemed on an order
   */
  async deductRewardPoints(id, pointsToDeduct) {
    if (!id || !pointsToDeduct || pointsToDeduct <= 0) return null;
    await pool.query(
      'UPDATE users SET reward_points = GREATEST(0, reward_points - ?) WHERE id = ?',
      [Number(pointsToDeduct), id]
    );
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
   * Find customers that need synchronization with TechPOS
   * (role = 'user' or user_type = 'Customer') and (techpos_sync_status != 'synced' or techpos_member_id IS NULL)
   */
  async findCustomersNeedingSync() {
    const [rows] = await pool.query(`
      SELECT * FROM users
      WHERE (role = 'user' OR user_type = 'Customer')
        AND (techpos_sync_status != 'synced' OR techpos_member_id IS NULL)
      ORDER BY id ASC
    `);
    return rows;
  },

  /**
   * Get all users for office management with filters
   */
  async findAllOffice({ showInactive = false, search = '', userTypeId = null } = {}) {
    let query = `
      SELECT 
        u.id, 
        u.name, 
        u.first_name,
        u.last_name,
        u.username, 
        u.email, 
        u.role, 
        u.user_type, 
        u.user_type_id, 
        u.mob_no, 
        u.date_of_birth, 
        u.date_of_join, 
        u.techpos_member_id,
        u.elite_member_start_date,
        u.elite_member_end_date,
        u.techpos_sync_status,
        u.techpos_last_synced_at,
        u.password_set,
        u.reward_points,
        u.reward_points_dollar_value,
        u.card_number,
        u.is_elite,
        u.visit_count,
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
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.username LIKE ? OR u.mob_no LIKE ? OR CAST(u.techpos_member_id AS CHAR) LIKE ?)';
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
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
