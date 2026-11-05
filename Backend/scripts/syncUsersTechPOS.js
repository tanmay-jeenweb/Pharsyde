const path = require('path');
const fs = require('fs');
const { testConnection } = require('../config/db');
const pool = require('../config/db');
const { syncUsersBiDirectional } = require('../services/techposMemberService');

// --- Safeguard 1: Lock file mechanism to prevent overlapping cron runs on cPanel ---
const LOCK_FILE = path.join(__dirname, '.syncUsersTechPOS.lock');
const LOCK_MAX_AGE_MS = 8 * 60 * 1000; // 8 minutes stale lock threshold

function acquireLock() {
  try {
    if (fs.existsSync(LOCK_FILE)) {
      const lockContent = fs.readFileSync(LOCK_FILE, 'utf8').trim();
      const lockTime = parseInt(lockContent, 10);
      const lockAge = Date.now() - lockTime;
      if (lockAge < LOCK_MAX_AGE_MS) {
        console.log(`[${new Date().toISOString()}] ⚠️ Another user sync is already running (lock age: ${Math.round(lockAge / 1000)}s). Exiting.`);
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

const runUserSync = async () => {
  if (!acquireLock()) {
    process.exit(0);
  }

  // --- Safeguard 2: Safety timeout to force-kill process if API hangs on cPanel ---
  const SAFETY_TIMEOUT_MS = 360000; // 6 minutes
  const safetyTimeout = setTimeout(async () => {
    console.error(`[${new Date().toISOString()}] ❌ Fatal: User sync exceeded ${SAFETY_TIMEOUT_MS / 1000}s safety timeout. Force terminating.`);
    releaseLock();
    try { await pool.end(); } catch (e) {}
    process.exit(1);
  }, SAFETY_TIMEOUT_MS);
  safetyTimeout.unref();

  console.log('========================================================');
  console.log('👤 Starting TechPOS Customer / Member Synchronization Script');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
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
    const result = await syncUsersBiDirectional({ maxPages: 20, pageSize: 500 });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('========================================================');
    console.log(`✅ TechPOS User Synchronization Finished in ${duration}s!`);
    console.log(`📥 Total Fetched from TechPOS:  ${result.stats.fetchedFromTechPOS}`);
    console.log(`✨ New Imported from TechPOS:   ${result.stats.importedFromTechPOS}`);
    console.log(`🔄 Updated from TechPOS:        ${result.stats.updatedFromTechPOS}`);
    console.log(`🚀 Pushed to TechPOS:           ${result.stats.pushedToTechPOS}`);
    console.log(`⚠️ Errors:                     ${result.stats.errors.length}`);
    if (result.stats.errors.length > 0) {
      console.log('--- Error Details ---');
      result.stats.errors.slice(0, 10).forEach((err, idx) => {
        console.log(`  ${idx + 1}. ${err}`);
      });
      if (result.stats.errors.length > 10) {
        console.log(`  ... and ${result.stats.errors.length - 10} more`);
      }
    }
    console.log('========================================================');
  } catch (error) {
    console.error(`❌ TechPOS user sync failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    releaseLock();
    clearTimeout(safetyTimeout);
    // Close the connection pool so process terminates cleanly
    await pool.end();
  }
};

runUserSync();
