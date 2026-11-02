const crypto = require('crypto');
const dotenv = require('dotenv');
const path = require('path');
const ProductImageModel = require('../models/productImageModel');
const { filterProductForImageSync } = require('../models/productImageModel');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_COMPANY_CODE = process.env.TECHPOS_COMPANY_CODE || '467-41';
const DEFAULT_BRANCH_ID = process.env.TECHPOS_BRANCH_ID || '1';
const DEFAULT_PAGE_SIZE = parseInt(process.env.TECHPOS_PAGE_SIZE || '20', 10);
const DEFAULT_MAX_PAGES = parseInt(process.env.TECHPOS_MAX_PAGES || '150', 10);
const DEFAULT_BASE_URL =
  process.env.TECHPOS_EAPI_URL ||
  `https://techpos-eapi-prod.azurewebsites.net/${DEFAULT_COMPANY_CODE}/api/products/filterProducts`;

/**
 * Generate a hash signature for a page of products to detect repeated pages
 */
function getPageSignature(products = []) {
  const keys = products.map((p) => {
    if (!p || typeof p !== 'object') return '';
    return String(p.id || `fallback:${p.sku || ''}|${p.name || ''}`);
  });
  return crypto.createHash('sha256').update(keys.join('\n')).digest('hex').substring(0, 16);
}

/**
 * Helper to pause execution
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Build TechPOS eapi filterProducts payload
 */
function makePayload(page, pageSize, branchId) {
  return {
    ProductGroupId: '',
    Category: '',
    SortId: 1,
    Page: page,
    PageSize: pageSize,
    SearchText: '',
    Brand: [],
    Weight: [],
    Species: [],
    BranchId: String(branchId),
    Terpene: '',
    Mood: '',
    SubCategory: '',
    THCMAX: 100,
    THCMIN: 0,
    CBDMAX: 100,
    CBDMIN: 0,
    FromExpressCheckout: false,
    OnSale: false,
  };
}

/**
 * Fetch a single page from TechPOS eapi with retry mechanism
 */
async function fetchPage(url, payload, { timeoutMs = 45000, retries = 3 } = {}) {
  const headers = {
    'Accept': 'application/json, text/plain, */*',
    'Content-Type': 'application/json',
    'Domain': 'pharsydewebmenu.azurewebsites.net',
    'Origin': 'https://pharsydewebmenu.azurewebsites.net',
    'Referer': 'https://pharsydewebmenu.azurewebsites.net/',
    'timezone_offset': '-330',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (!result || result.success === false) {
        throw new Error(`API returned an unsuccessful response: ${JSON.stringify(result).substring(0, 300)}`);
      }

      const data = result.data || {};
      const products = Array.isArray(data.products) ? data.products : null;
      if (!products) {
        throw new Error(`Unexpected API response structure (data.products missing)`);
      }

      return {
        products,
        totalRecords: data.totalRecords,
        totalOnSale: data.totalOnSale,
        httpStatus: response.status,
      };
    } catch (err) {
      clearTimeout(timer);
      if (attempt >= retries) {
        throw new Error(`Request failed after ${retries + 1} attempt(s): ${err.message}`);
      }
      const waitTime = Math.min(Math.pow(2, attempt) * 1000, 15000);
      console.warn(`[TechPOS Image Sync] Attempt ${attempt + 1} failed: ${err.message}. Retrying in ${waitTime}ms...`);
      await delay(waitTime);
    }
  }
}

/**
 * Main service to fetch TechPOS product images, save them into techpos_product_images table,
 * and sync them directly to the products table.
 */
async function syncProductImages({
  companyCode = DEFAULT_COMPANY_CODE,
  branchId = DEFAULT_BRANCH_ID,
  pageSize = DEFAULT_PAGE_SIZE,
  maxPages = DEFAULT_MAX_PAGES,
  requestDelayMs = 300,
} = {}) {
  const url = DEFAULT_BASE_URL.replace('{company}', companyCode);

  console.log('========================================================');
  console.log('🖼️  TechPOS Image Sync Service');
  console.log(`Endpoint:    ${url}`);
  console.log(`Company:     ${companyCode} | Branch: ${branchId} | PageSize: ${pageSize}`);
  console.log('========================================================');

  // 1. Ensure the dedicated table exists
  await ProductImageModel.createTable();

  const seenSignatures = new Map();
  const seenIds = new Set();
  let totalUniqueFetched = 0;
  let totalWithImages = 0;
  let reportedTotal = null;
  let stopReason = 'maximum page limit reached';

  const startTime = Date.now();

  for (let page = 1; page <= maxPages; page++) {
    const payload = makePayload(page, pageSize, branchId);
    let pageData;

    try {
      pageData = await fetchPage(url, payload);
    } catch (err) {
      stopReason = `Request failed on page ${page}: ${err.message}`;
      console.error(`[TechPOS Image Sync] ❌ ${stopReason}`);
      break;
    }

    const { products, totalRecords, totalOnSale } = pageData;

    if (reportedTotal === null) {
      reportedTotal = totalRecords;
      console.log(`[TechPOS Image Sync] API reports totalRecords=${reportedTotal}, totalOnSale=${totalOnSale}`);
    }

    if (!products || products.length === 0) {
      stopReason = `Empty page received at page ${page}`;
      console.log(`[TechPOS Image Sync] Page ${page}: ${stopReason}.`);
      break;
    }

    // Detect exact repeated page to avoid infinite pagination
    const signature = getPageSignature(products);
    if (seenSignatures.has(signature)) {
      const firstPage = seenSignatures.get(signature);
      stopReason = `Exact page repeated: page ${page} matches page ${firstPage}`;
      console.log(`[TechPOS Image Sync] Page ${page}: ${stopReason}. Stopping export.`);
      break;
    }
    seenSignatures.set(signature, page);

    // Filter down to only necessary fields for image sync
    const leanBatch = [];
    for (const rawProduct of products) {
      if (!rawProduct || typeof rawProduct !== 'object') continue;

      const leanItem = filterProductForImageSync(rawProduct, page);
      if (!leanItem.id) continue;

      if (!seenIds.has(leanItem.id)) {
        seenIds.add(leanItem.id);
        totalUniqueFetched++;
        if (leanItem.imageUrl) {
          totalWithImages++;
        }
      }
      leanBatch.push(leanItem);
    }

    // Directly upsert lean batch into techpos_product_images table
    if (leanBatch.length > 0) {
      await ProductImageModel.bulkUpsert(leanBatch);
    }

    const isShortPage = products.length < pageSize;
    console.log(
      `[TechPOS Image Sync] Page ${page}: received ${products.length} items; unique running total: ${totalUniqueFetched} (${totalWithImages} with image)` +
        (isShortPage ? ' [SHORT PAGE - continuing]' : '')
    );

    if (requestDelayMs > 0) {
      await delay(requestDelayMs);
    }
  }

  const fetchDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`[TechPOS Image Sync] Finished fetching and storing in ${fetchDuration}s. Reason: ${stopReason}`);

  // 2. Perform direct SQL JOIN update into main products table
  console.log('[TechPOS Image Sync] Updating main products table with images...');
  const syncResult = await ProductImageModel.syncToProductsTable();

  console.log('========================================================');
  console.log('✅ TechPOS Image Sync Completed Successfully!');
  console.log(`📥 Total Unique Products Stored in Cache: ${totalUniqueFetched}`);
  console.log(`🖼️  Products With Valid Image URLs:       ${totalWithImages}`);
  console.log(`🔗 Updated in Products Table by PK:       ${syncResult.updatedByPk}`);
  console.log(`🔍 Updated in Products Table by SKU:      ${syncResult.updatedBySku}`);
  console.log(`📊 Total Products in DB with Image:       ${syncResult.totalWithImagesInProducts}`);
  console.log('========================================================');

  return {
    success: true,
    stopReason,
    durationSeconds: Number(fetchDuration),
    totalFetched: totalUniqueFetched,
    totalWithImages,
    apiTotalRecords: reportedTotal,
    productsUpdatedByPk: syncResult.updatedByPk,
    productsUpdatedBySku: syncResult.updatedBySku,
    totalWithImagesInProducts: syncResult.totalWithImagesInProducts,
  };
}

module.exports = {
  syncProductImages,
  fetchPage,
  getPageSignature,
  makePayload,
};

