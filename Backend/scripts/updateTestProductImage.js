const path = require('path');
const pool = require('../config/db');
const { testConnection } = require('../config/db');

// Product target constants
const TARGET_PRODUCT_ID = '7746';
const DEFAULT_IMAGE_URL = '/images/products/7746-test.png';

/**
 * Updates product #7746 with an image URL in both products and techpos_product_images tables.
 * Can be run standalone or passed a custom image URL as an argument.
 */
async function updateTestProductImage(customImageUrl = null) {
  const imageUrl = customImageUrl || process.argv[2] || DEFAULT_IMAGE_URL;

  console.log('========================================================');
  console.log(`🖼️  Updating Image for Product #${TARGET_PRODUCT_ID}`);
  console.log(`🔗  Image URL: ${imageUrl}`);
  console.log('========================================================');

  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Database connection failed. Please ensure MySQL is running.');
    process.exit(1);
  }

  try {
    // 1. Update in 'products' table
    const [prodResult] = await pool.query(
      `UPDATE products 
       SET imageUrl = ?, 
           active = 1, 
           updated_at = CURRENT_TIMESTAMP 
       WHERE pk = ?`,
      [imageUrl, TARGET_PRODUCT_ID]
    );

    // If product row did not exist yet on a fresh developer DB, insert it
    if (prodResult.affectedRows === 0) {
      console.log(`ℹ️  Product #${TARGET_PRODUCT_ID} not found in products table. Inserting record...`);
      await pool.query(
        `INSERT INTO products (
          pk, product_name, sku, category, retail_price, qty_available, active, imageUrl
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE imageUrl = VALUES(imageUrl), active = 1`,
        [TARGET_PRODUCT_ID, 'test ', 'Test', 'Accessories', '0.01', 99.000, 1, imageUrl]
      );
      console.log(`✅ Created product #${TARGET_PRODUCT_ID} in 'products' table with image.`);
    } else {
      console.log(`✅ Updated 'products' table for #${TARGET_PRODUCT_ID} (${prodResult.affectedRows} row affected).`);
    }

    // 2. Upsert in 'techpos_product_images' table
    await pool.query(
      `INSERT INTO techpos_product_images (id, sku, name, imageUrl, raw_images_urls, source_page)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         imageUrl = VALUES(imageUrl),
         raw_images_urls = VALUES(raw_images_urls),
         updated_at = CURRENT_TIMESTAMP`,
      [TARGET_PRODUCT_ID, 'Test', 'test ', imageUrl, JSON.stringify([imageUrl]), 3]
    );
    console.log(`✅ Updated 'techpos_product_images' table for #${TARGET_PRODUCT_ID}.`);

    // 3. Verify and display the updated rows
    const [updatedProduct] = await pool.query(
      'SELECT pk, product_name, sku, category, retail_price, active, imageUrl FROM products WHERE pk = ?',
      [TARGET_PRODUCT_ID]
    );
    const [updatedImageRecord] = await pool.query(
      'SELECT id, sku, name, imageUrl FROM techpos_product_images WHERE id = ?',
      [TARGET_PRODUCT_ID]
    );

    console.log('\n--- Verified Records in Database ---');
    console.log('📦 products table:', updatedProduct[0]);
    console.log('🖼️ techpos_product_images table:', updatedImageRecord[0]);
    console.log('\n🎉 Product #7746 image updated successfully!');
    console.log('💡 Developers can run this anytime via:');
    console.log('   npm run update:test-image\n');
  } catch (error) {
    console.error('❌ Failed to update product image:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Execute if run directly from CLI
if (require.main === module) {
  updateTestProductImage();
}

module.exports = updateTestProductImage;

