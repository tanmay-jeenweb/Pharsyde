const dotenv = require('dotenv');
const path = require('path');
const ProductModel = require('../models/productModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_TECHPOS_URL = 'https://integrations-api.techpos.ca/467-41/api/openAPI/allProducts/1';
const DEFAULT_TECHPOS_KEY = 'Ym9KsXaM3M7W2B301iI3ynU1';

/**
 * Fetch products from the TechPOS OpenAPI endpoint
 * @returns {Promise<Array>} Array of raw products from TechPOS
 */
const fetchTechPOSProducts = async () => {
  const url = process.env.TECHPOS_API_URL || DEFAULT_TECHPOS_URL;
  const apiKey = process.env.TECHPOS_API_KEY || DEFAULT_TECHPOS_KEY;

  console.log(`[TechPOS Service] Fetching products from: ${url}`);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'TechPOSAPIKey': apiKey,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TechPOS API error (${response.status} ${response.statusText}): ${errorText}`);
  }

  const data = await response.json();
  let products = [];
  if (Array.isArray(data)) {
    products = data;
  } else if (data && data.data && Array.isArray(data.data.items)) {
    products = data.data.items;
  } else if (data && Array.isArray(data.data)) {
    products = data.data;
  } else if (data && Array.isArray(data.items)) {
    products = data.items;
  } else if (data && Array.isArray(data.products)) {
    products = data.products;
  }
  console.log(`[TechPOS Service] Received ${products.length} products from TechPOS.`);
  return products;
};

/**
 * Fetch and sync all TechPOS products directly into MySQL products table
 * @returns {Promise<{ success: boolean, totalFetched: number, upsertedCount: number }>}
 */
const syncTechPOSProducts = async () => {
  // Ensure the products table is created
  await ProductModel.createTable();

  // Fetch live products from TechPOS
  const products = await fetchTechPOSProducts();

  if (products.length === 0) {
    return {
      success: true,
      totalFetched: 0,
      upsertedCount: 0,
      message: 'No products returned from TechPOS API',
    };
  }

  // Populate / bulk-upsert into MySQL
  console.log(`[TechPOS Service] Populating ${products.length} products into MySQL...`);
  const result = await ProductModel.bulkUpsert(products, 100);

  console.log(`[TechPOS Service] ✓ Populated ${result.insertedOrUpdated} products successfully.`);
  return {
    success: true,
    totalFetched: products.length,
    upsertedCount: result.insertedOrUpdated,
    message: `Successfully populated ${result.insertedOrUpdated} products into the database`,
  };
};

module.exports = {
  fetchTechPOSProducts,
  syncTechPOSProducts,
};
