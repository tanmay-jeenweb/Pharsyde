const pool = require('../config/db');

async function migrate() {
  console.log('[Migration] Creating email_otps table...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS email_otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(150) NOT NULL,
        otp_hash VARCHAR(255) NOT NULL,
        purpose ENUM('customer_register', 'guest_checkout') NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 5,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        verification_token VARCHAR(255) NULL,
        expires_at DATETIME NOT NULL,
        verified_at DATETIME NULL,
        ip_address VARCHAR(45) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email_purpose (email, purpose),
        INDEX idx_token (verification_token),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('[Migration] ✓ email_otps table created successfully.');
  } catch (error) {
    console.error('[Migration] Failed to create email_otps table:', error);
    process.exit(1);
  }
  process.exit(0);
}

migrate();

