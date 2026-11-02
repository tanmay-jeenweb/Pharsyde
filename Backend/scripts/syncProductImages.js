const { testConnection } = require('../config/db');
const pool = require('../config/db');
const { syncProductImages } = require('../services/techposImageService');

const runSyncImages = async () => {
  console.log('========================================================');
  console.log('🖼️  Starting Direct TechPOS Product Image Sync');
  console.log('========================================================');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Could not connect to MySQL. Please verify your .env settings and ensure MySQL server is running.');
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
    process.exit(1);
  } finally {
    // Close the connection pool so process terminates cleanly
    await pool.end();
  }
};

runSyncImages();

