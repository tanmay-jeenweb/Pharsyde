const fs = require('fs');
const path = require('path');
const pool = require('../config/db');
const { testConnection } = require('../config/db');
const { parseCSV } = require('../utils/csvParser');

/**
 * Clean image URL string by removing brackets and quotes
 * e.g., '["https://pharsyde...png"]' -> 'https://pharsyde...png'
 * Also handles comma-separated URLs if multiple exist.
 */
function cleanImageUrl(raw) {
  if (!raw || typeof raw !== 'string') return { primary: null, secondary: null };

  // Remove brackets and quotes
  const unbracketed = raw.replace(/[\[\]"]/g, '').trim();
  if (!unbracketed) return { primary: null, secondary: null };

  // If there are comma-separated URLs
  const urls = unbracketed.split(',').map(u => u.trim()).filter(Boolean);
  return {
    primary: urls[0] || null,
    secondary: urls[1] || null
  };
}

/**
 * Main function to update product image URLs from CSV
 */
async function updateProductImagesFromCSV(customCsvPath = null) {
  console.log('========================================================');
  console.log('🖼️  Updating Product Image URLs from CSV');
  console.log('========================================================');

  const connected = await testConnection();
  if (!connected) {
    throw new Error('Database connection failed. Please ensure MySQL is running.');
  }

  // Determine CSV file location
  const defaultPath = path.resolve(__dirname, '../data/pharsyde_products.csv');
  const fallbackPath = 'C:/Users/DELL/.gemini/antigravity/brain/25a21a99-a2de-4fc1-a598-a3520b547fbc/.user_uploaded/media_1793450795515_3ed1c15c.csv';

  let csvPath = customCsvPath;
  if (!csvPath || !fs.existsSync(csvPath)) {
    if (fs.existsSync(defaultPath)) {
      csvPath = defaultPath;
    } else if (fs.existsSync(fallbackPath)) {
      csvPath = fallbackPath;
    } else {
      throw new Error(`CSV file not found at ${defaultPath} or ${fallbackPath}`);
    }
  }

  console.log(`📄 Reading CSV from: ${csvPath}`);
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const rows = parseCSV(fileContent);

  if (rows.length < 2) {
    console.log('⚠️  CSV file is empty or contains only header.');
    return { total: 0, updated: 0 };
  }

  const header = rows[0].map(h => h.trim());
  const idIdx = header.indexOf('id');
  const skuIdx = header.indexOf('sku');
  const imgIdx = header.indexOf('imagesUrls');
  const nameIdx = header.indexOf('name');

  if (idIdx === -1 || imgIdx === -1) {
    throw new Error(`Required columns ('id' and 'imagesUrls') not found in CSV header.`);
  }

  console.log(`📊 Total rows in CSV: ${rows.length - 1}`);

  let updatedBoth = 0;
  let updatedPkOnly = 0;
  let skippedNoImage = 0;
  let notFound = 0;
  const sampleUpdates = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length <= idIdx) continue;

    const id = row[idIdx]?.trim();
    const sku = skuIdx !== -1 ? row[skuIdx]?.trim() : null;
    const rawImg = row[imgIdx]?.trim();
    const name = nameIdx !== -1 ? row[nameIdx]?.trim() : '';

    const { primary: cleanUrl, secondary: secondCleanUrl } = cleanImageUrl(rawImg);

    if (!cleanUrl) {
      skippedNoImage++;
      continue;
    }

    // Step 1: Attempt matching strictly on both pk (id) and sku
    let updated = false;
    if (sku) {
      const [result] = await pool.query(
        'UPDATE products SET imageUrl = ?, secondImageUrl = COALESCE(?, secondImageUrl) WHERE pk = ? AND sku = ?',
        [cleanUrl, secondCleanUrl, id, sku]
      );
      if (result.affectedRows > 0) {
        updatedBoth++;
        updated = true;
        if (sampleUpdates.length < 5) {
          sampleUpdates.push({ id, sku, name, imageUrl: cleanUrl, matchType: 'id + sku' });
        }
      }
    }

    // Step 2: Fallback for records where Excel corrupted the sku (e.g. scientific notation 8.27152E+11)
    if (!updated && id) {
      const [result] = await pool.query(
        'UPDATE products SET imageUrl = ?, secondImageUrl = COALESCE(?, secondImageUrl) WHERE pk = ?',
        [cleanUrl, secondCleanUrl, id]
      );
      if (result.affectedRows > 0) {
        updatedPkOnly++;
        updated = true;
        if (sampleUpdates.length < 5) {
          sampleUpdates.push({ id, sku, name, imageUrl: cleanUrl, matchType: 'id (excel formatted sku)' });
        }
      }
    }

    if (!updated) {
      notFound++;
    }
  }

  console.log('========================================================');
  console.log('✅ Image URL Update Complete!');
  console.log(`🔗 Matched strictly on (id + sku):       ${updatedBoth}`);
  console.log(`🔍 Matched on id (Excel SKU format):     ${updatedPkOnly}`);
  console.log(`📈 Total Products Updated with Image:    ${updatedBoth + updatedPkOnly}`);
  console.log(`⏭️  Skipped (No Image in CSV):            ${skippedNoImage}`);
  console.log(`❓ Products Not Found in DB:             ${notFound}`);
  console.log('========================================================');
  console.log('🔍 Sample Updated Products:');
  console.log(JSON.stringify(sampleUpdates, null, 2));

  return {
    totalRows: rows.length - 1,
    updatedBoth,
    updatedPkOnly,
    totalUpdated: updatedBoth + updatedPkOnly,
    skippedNoImage,
    notFound,
    sampleUpdates
  };
}

module.exports = {
  cleanImageUrl,
  updateProductImagesFromCSV,
};

// Execute directly if run as a script
if (require.main === module) {
  updateProductImagesFromCSV()
    .catch(err => {
      console.error('❌ Error updating product images:', err);
      process.exit(1);
    })
    .finally(async () => {
      await pool.end();
    });
}

