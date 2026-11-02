const pool = require('../config/db');

/**
 * Users Table Definition
 */
const USER_TABLE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )
`;

const UserModel = {
  /**
   * Initialize / verify users table
   */
  async createTable() {
    await pool.query(USER_TABLE_SCHEMA);
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
   * Find user by ID (excluding password)
   */
  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Create a new user
   */
  async create({ name, email, password, role = 'user' }) {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );
    return { id: result.insertId, name, email, role };
  },

  /**
   * Get all users (Admin)
   */
  async findAll() {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  },
};

module.exports = UserModel;
module.exports.UserModel = UserModel;
module.exports.USER_TABLE_SCHEMA = USER_TABLE_SCHEMA;
