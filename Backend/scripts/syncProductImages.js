const path = require('path');
const fs = require('fs');
const { testConnection } = require('../config/db');
const pool = require('../config/db');
const { syncProductImages } = require('../services/techposImageService');

// --- Safeguard 1: Lock file mechanism to prevent overlapping cron runs on cPanel ---
const LOCK_FILE = path.join(__dirname, '.syncProductImages.lock');
const LOCK_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes stale lock threshold (multi-page image fetch)

function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockContent = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      const lockTime = parseInt(lockContent, 10);
      const lockAge = Date.now() - lockTime;
      if (lockAge < LOCK_MAX_AGE_MS) {
        console.log(`[${new Date().toISOString()}] ⚠️ Another product image sync is already running (lock age: ${Math.round(lockAge / 1000)}s). Exiting.`);
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

const runSyncImages = async () => {
  if (!acquireLock()) {
    process.exit(0);
  }

  // --- Safeguard 2: Safety timeout to force-kill process if API hangs on cPanel ---
  const SAFETY_TIMEOUT_MS = 600000; // 10 minutes safety timeout
  const safetyTimeout = setTimeout(async () => {
    console.error(`[${new Date().toISOString()}] ❌ Fatal: Image sync exceeded ${SAFETY_TIMEOUT_MS / 1000}s safety timeout. Force terminating.`);
    releaseLock();
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }, SAFETY_TIMEOUT_MS);
  safetyTimeout.unref();

  console.log('========================================================');
  console.log('🖼️  Starting Direct TechPOS Product Image Sync');
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
    const result = await syncProductImages();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('========================================================');
    console.log(`✅ Image Sync Completed in ${duration}s!`);
    console.log(`📥 Total Fetched & Cached:   ${result.totalFetched}`);
    console.log(`🖼️  With Valid Image:         ${result.totalWithImages}`);
    console.log(`🔗 Updated in Products (PK):  ${result.productsUpdatedByPk}`);
    console.log(`🔍 Updated in Products (SKU): ${result.productsUpdatedBySku}`);
    console.log(`📊 Products with Image in DB: ${result.totalWithImagesInProducts}`);
    console.log('========================================================');
  } catch (error) {
    console.error(`❌ TechPOS Image Sync failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    releaseLock();
    clearTimeout(safetyTimeout);
    // Close the connection pool so process terminates cleanly
    await pool.end();
  }
};

runSyncImages();
