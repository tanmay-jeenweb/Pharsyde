const { testConnection } = require('../config/db');
const pool = require('../config/db');
const { syncTechPOSProducts } = require('../services/techposService');

const runSync = async () => {
  console.log('========================================================');
  console.log('📦 Starting TechPOS Product Population Script');
  console.log('========================================================');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Could not connect to MySQL. Please verify your .env settings and ensure MySQL server is running.');
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
    process.exit(1);
  } finally {
    // Close the connection pool so process terminates cleanly
    await pool.end();
  }
};

runSync();
