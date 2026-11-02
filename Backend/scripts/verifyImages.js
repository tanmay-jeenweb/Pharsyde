const pool = require('../config/db');
const { testConnection } = require('../config/db');

async function verifyDB() {
  await testConnection();
  const [totalWithImg] = await pool.query('SELECT COUNT(*) as count FROM products WHERE imageUrl IS NOT NULL AND imageUrl != ""');
  const [bracketCheck] = await pool.query('SELECT COUNT(*) as count FROM products WHERE imageUrl LIKE "%[%" OR imageUrl LIKE "%]%" OR imageUrl LIKE \'%"%\'');
  const [samples] = await pool.query('SELECT pk, sku, product_name, imageUrl FROM products WHERE imageUrl IS NOT NULL AND imageUrl != "" LIMIT 5');

  console.log('--- Verification Report ---');
  console.log('Total products with imageUrl in DB:', totalWithImg[0].count);
  console.log('Products with brackets or quotes in imageUrl:', bracketCheck[0].count);
  console.log('Sample updated records:');
  console.log(JSON.stringify(samples, null, 2));

  await pool.end();
}

verifyDB().catch(console.error);
