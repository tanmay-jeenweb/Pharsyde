const pool = require('../config/db');

async function migrate() {
  console.log('[Migration] Starting payment tables migration...');

  // 1. Order Sequences Table (Atomic sequence generator for PHR-100xxx)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_sequences (
      sequence_name VARCHAR(50) PRIMARY KEY,
      current_val BIGINT NOT NULL DEFAULT 100000
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);

  await pool.query(`
    INSERT IGNORE INTO order_sequences (sequence_name, current_val)
    VALUES ('pharsyde_order', 100000);
  `);
  console.log('[Migration] ✓ order_sequences verified/seeded.');

  // 2. Payment Attempts Table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_attempts (
      id INT AUTO_INCREMENT PRIMARY KEY,
      attempt_number VARCHAR(64) NOT NULL UNIQUE,
      user_id INT NULL,
      guest_token_hash VARCHAR(128) NULL,
      status ENUM('created', 'preloaded', 'processing', 'approved', 'declined', 'cancelled', 'failed') DEFAULT 'created',
      finalization_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
      order_type ENUM('pickup', 'delivery') DEFAULT 'pickup',
      subtotal_cents INT NOT NULL DEFAULT 0,
      gst_cents INT NOT NULL DEFAULT 0,
      pst_cents INT NOT NULL DEFAULT 0,
      tax_cents INT NOT NULL DEFAULT 0,
      shipping_cents INT NOT NULL DEFAULT 0,
      total_cents INT NOT NULL DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'CAD',
      items_json JSON NOT NULL,
      customer_info_json JSON NOT NULL,
      shipping_address_json JSON NULL,
      merchant_order_number VARCHAR(100) NOT NULL UNIQUE,
      moneris_ticket VARCHAR(255) NULL,
      moneris_response JSON NULL,
      failure_reason TEXT NULL,
      final_order_id INT NULL,
      finalization_error TEXT NULL,
      finalized_at TIMESTAMP NULL,
      verified_at TIMESTAMP NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_pa_user (user_id),
      INDEX idx_pa_ticket (moneris_ticket),
      INDEX idx_pa_merchant_order (merchant_order_number),
      INDEX idx_pa_status (status),
      INDEX idx_pa_fin_status (finalization_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('[Migration] ✓ payment_attempts table verified.');

  // 3. Add Moneris Columns to orders Table
  const [cols] = await pool.query('SHOW COLUMNS FROM orders');
  const existingColNames = cols.map((c) => c.Field);

  const columnsToAdd = [
    { name: 'payment_attempt_id', type: 'INT NULL' },
    { name: 'moneris_ticket', type: 'VARCHAR(255) NULL' },
    { name: 'moneris_reference_no', type: 'VARCHAR(100) NULL' },
    { name: 'moneris_auth_code', type: 'VARCHAR(100) NULL' },
    { name: 'card_brand', type: 'VARCHAR(50) NULL' },
    { name: 'card_last4', type: 'VARCHAR(4) NULL' },
  ];

  for (const col of columnsToAdd) {
    if (!existingColNames.includes(col.name)) {
      await pool.query(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
      console.log(`[Migration] + Added column ${col.name} to orders table.`);
    }
  }

  console.log('[Migration] ✓ Migration complete!');
}

if (require.main === module) {
  migrate()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Error]', err);
      process.exit(1);
    });
}

module.exports = migrate;

