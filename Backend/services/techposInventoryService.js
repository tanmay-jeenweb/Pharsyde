const dotenv = require('dotenv');
const path = require('path');
const pool = require('../config/db');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const DEFAULT_COMPANY_CODE = '467-41';
const DEFAULT_BRANCH_ID = '1';
const DEFAULT_TECHPOS_KEY = 'Ym9KsXaM3M7W2B301iI3ynU1';

/**
 * Fetch live inventory from TechPOS OpenAPI for a specific product
 * @param {Object} options
 * @param {string|number} options.productId - TechPOS product ID
 * @param {string} options.sku - Product SKU
 * @param {string|number} [options.branchId] - Branch ID (default: 1)
 * @param {boolean} [options.skipCacheUpdate] - Whether to avoid overwriting MySQL qty_available
 * @returns {Promise<{ found: boolean, stock: number, source: string }>}
 */
async function getLiveTechPosStock({ productId, sku, branchId = DEFAULT_BRANCH_ID, skipCacheUpdate = false }) {
  const companyCode = process.env.TECHPOS_COMPANY_CODE || DEFAULT_COMPANY_CODE;
  const apiKey = process.env.TECHPOS_API_KEY || DEFAULT_TECHPOS_KEY;
  const branch = String(branchId || DEFAULT_BRANCH_ID);

  const numericProductId = Number(productId);
  const isNumericId = Number.isFinite(numericProductId) && numericProductId > 0;

  // 1. Try querying TechPOS OpenAPI live if numeric ID is available
  if (isNumericId) {
    try {
      const url = `https://integrations-api.techpos.ca/${companyCode}/api/openAPI/getInventory?branch=${branch}&category=0&iscannabis=2&pageNumber=1&pageSize=5&productId=${numericProductId}&species=0&weightoption=0&selectedDate=${encodeURIComponent(new Date().toISOString())}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'TechPOSAPIKey': apiKey,
        },
      });

      if (res.ok) {
        const json = await res.json();
        const items = json?.data ?? json?.items ?? [];

        if (Array.isArray(items) && items.length > 0) {
          const item = items[0];
          const rawStock = item.storeQuantity ?? item.qty_available;
          const stock = Number.isFinite(Number(rawStock)) ? Math.max(0, Math.floor(Number(rawStock))) : 0;

          // Update local cache in MySQL asynchronously if not skipped
          if (!skipCacheUpdate) {
            pool.query(
              'UPDATE products SET qty_available = ? WHERE pk = ?',
              [stock, String(numericProductId)]
            ).catch(() => {});
          }

          return { found: true, stock, source: 'techpos_live' };
        }
      }
    } catch (err) {
      console.warn('[TechPOS Live Inventory Check Warning]', err.message);
    }
  }

  // 2. Fallback to local MySQL database inventory
  try {
    let rows = [];
    if (isNumericId) {
      [rows] = await pool.query('SELECT qty_available FROM products WHERE pk = ?', [String(numericProductId)]);
    }
    if ((!rows || rows.length === 0) && sku) {
      [rows] = await pool.query('SELECT qty_available FROM products WHERE sku = ?', [String(sku)]);
    }

    if (rows && rows.length > 0) {
      const stock = Math.max(0, Math.floor(Number(rows[0].qty_available) || 0));
      return { found: true, stock, source: 'mysql_cache' };
    }
  } catch (dbErr) {
    console.warn('[Local Inventory Check Warning]', dbErr.message);
  }

  return { found: false, stock: 99, source: 'untracked' };
}

/**
 * Re-check and reconcile TechPOS cloud stock and local stock after order cancellation
 * Note: Local DB stock is already restored by OrderModel.cancelOrder.
 * This method verifies the real-time TechPOS OpenAPI store quantity and synchronizes.
 * @param {Array<Object>} items - Array of order items to verify
 * @returns {Promise<Array<Object>>} Restoration results per item
 */
async function reconcileCancelledOrderStock(items = []) {
  const results = [];

  for (const item of items) {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const productId = item.product_id || item.productId || item.pk || null;
    const techPosId = item.techpos_product_id || item.techPosProductId || null;
    const sku = item.sku || null;
    const targetIdentifier = productId || techPosId;

    let localStock = null;
    try {
      if (targetIdentifier) {
        const [rows] = await pool.query('SELECT qty_available FROM products WHERE pk = ?', [String(targetIdentifier)]);
        if (rows.length > 0) localStock = Number(rows[0].qty_available);
      } else if (sku) {
        const [rows] = await pool.query('SELECT qty_available FROM products WHERE sku = ?', [String(sku)]);
        if (rows.length > 0) localStock = Number(rows[0].qty_available);
      }
    } catch (readErr) {
      console.warn(`[Stock Read Warning] Product ${targetIdentifier || sku}:`, readErr.message);
    }

    // Inspect live TechPOS cloud stock (queries getInventory OpenAPI)
    let techPosLive = null;
    try {
      techPosLive = await getLiveTechPosStock({
        productId: techPosId || productId,
        sku,
        skipCacheUpdate: true,
      });

      // If TechPOS live stock is confirmed from live API, reconcile local cache to match live store stock
      if (techPosLive && techPosLive.found && techPosLive.source === 'techpos_live' && Number.isFinite(techPosLive.stock)) {
        const targetPk = String(targetIdentifier);
        if (targetPk && targetPk !== 'null') {
          await pool.query('UPDATE products SET qty_available = ? WHERE pk = ?', [techPosLive.stock, targetPk]);
          localStock = techPosLive.stock;
          console.log(`[TechPOS Stock Reconciled] Product ${targetPk}: Synced to TechPOS live stock (${techPosLive.stock} units).`);
        }
      }
    } catch (liveErr) {
      console.warn(`[TechPOS Stock Re-check Warning] Could not check TechPOS live stock:`, liveErr.message);
    }

    results.push({
      productId: targetIdentifier,
      sku,
      quantityRestored: qty,
      localDbRestored: true,
      localDbStock: localStock,
      techPosCloudStock: techPosLive?.stock ?? null,
      techPosSource: techPosLive?.source ?? 'unknown',
    });
  }

  return results;
}

module.exports = {
  getLiveTechPosStock,
  reconcileCancelledOrderStock,
};

