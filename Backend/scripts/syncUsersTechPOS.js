const { testConnection } = require('../config/db');
const pool = require('../config/db');
const { syncUsersBiDirectional } = require('../services/techposMemberService');

const runUserSync = async () => {
  console.log('========================================================');
  console.log('👤 Starting TechPOS Customer / Member Synchronization Script');
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  console.log('========================================================');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Could not connect to MySQL. Please verify your .env settings and ensure MySQL server is running.');
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
    process.exit(1);
  } finally {
    // Close the connection pool so process terminates cleanly
    await pool.end();
  }
};

runUserSync();

