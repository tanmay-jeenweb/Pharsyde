const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Explicitly load .env from Backend directory regardless of execution cwd
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pharsyde_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] MySQL connected successfully to: ${process.env.DB_NAME || 'pharsyde_db'}`);
    connection.release();
    return true;
  } catch (error) {
    console.error(`[Database Warning] MySQL connection failed: ${error.message}`);
    console.warn(`[Tip] Ensure MySQL (XAMPP / WAMP / MySQL Workbench / Docker) is running and verify DB credentials in .env.`);
    return false;
  }
};

module.exports = pool;
module.exports.testConnection = testConnection;
