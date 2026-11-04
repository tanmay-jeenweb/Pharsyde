const pool = require('../config/db');

async function migrateGovIdColumn() {
  console.log('[Migration] Checking gov_id_url column in orders table...');
  try {
    const [cols] = await pool.query('SHOW COLUMNS FROM orders');
    const existingColNames = cols.map((c) => c.Field);

    if (!existingColNames.includes('gov_id_url')) {
      await pool.query('ALTER TABLE orders ADD COLUMN gov_id_url VARCHAR(500) NULL AFTER notes');
      console.log('[Migration] ✓ Added column gov_id_url to orders table.');
    } else {
      console.log('[Migration] ✓ Column gov_id_url already exists in orders table.');
    }
  } catch (err) {
    console.warn('[Migration Warning] Could not alter orders table for gov_id_url:', err.message);
  }
}

if (require.main === module) {
  migrateGovIdColumn()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Migration Error]', err);
      process.exit(1);
    });
}

module.exports = migrateGovIdColumn;

