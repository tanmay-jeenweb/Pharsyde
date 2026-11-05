const path = require('path');
const fs = require('fs');
const { testConnection } = require('../config/db');
const pool = require('../config/db');
const { syncTechPOSProducts } = require('../services/techposService');

// --- Safeguard 1: Lock file mechanism to prevent overlapping cron runs on cPanel ---
const LOCK_FILE = path.join(__dirname, '.syncProducts.lock');
const LOCK_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes stale lock threshold

function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockContent = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      const lockTime = parseInt(lockContent, 10);
      const lockAge = Date.now() - lockTime;
      if (lockAge < LOCK_MAX_AGE_MS) {
        console.log(`[${new Date().toISOString()}] ⚠️ Another product sync is already running (lock age: ${Math.round(lockAge / 1000)}s). Exiting.`);
        return false;
      }
      console.warn(`[${new Date().toISOString()}] ⚠️ Stale lock detected (age: ${Math.round(lockAge / 1000)}s). Overriding lock.`);
    }
    fs.writeFileSync(LOCK_FILE, String(Date.now()));
    return true;
  } catch (err) {
    return true; // Proceed anyway if lock mechanism encounters file permission issues
  }
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
  } catch (e) {}
}

const runSync = async () => {
  if (!acquireLock()) {
    process.exit(0);
  }

  // --- Safeguard 2: Safety timeout to force-kill process if API hangs on cPanel ---
  const SAFETY_TIMEOUT_MS = 240000; // 4 minutes
  const safetyTimeout = setTimeout(async () => {
    console.error(`[${new Date().toISOString()}] ❌ Fatal: Product sync exceeded ${SAFETY_TIMEOUT_MS / 1000}s safety timeout. Force terminating.`);
    releaseLock();
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }, SAFETY_TIMEOUT_MS);
  safetyTimeout.unref();

  console.log('========================================================');
  console.log('📦 Starting TechPOS Product Population Script');
  console.log('========================================================');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Could not connect to MySQL. Please verify your .env settings and ensure MySQL server is running.');
    releaseLock();
    clearTimeout(safetyTimeout);
    await pool.end();
    process.exit(1);
  }

  try {
    const startTime = Date.now();
    const result = await syncTechPOSProducts();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('========================================================');
    console.log(`✅ TechPOS Population Complete in ${duration}s!`);
    console.log(`📥 Total Fetched:  ${result.totalFetched}`);
    console.log(`💾 Total Stored:   ${result.upsertedCount}`);
    console.log('========================================================');
  } catch (error) {
    console.error(`❌ TechPOS sync failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    releaseLock();
    clearTimeout(safetyTimeout);
    // Close the connection pool so process terminates cleanly
    await pool.end();
  }
};

runSync();
