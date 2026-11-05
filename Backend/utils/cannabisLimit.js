/**
 * Cannabis Legal Purchase Limit Utility (Backend)
 * Canadian Cannabis Act & Manitoba Provincial Law:
 * Max 30.0 grams of dried cannabis equivalent (DFE) per transaction.
 */

const { classifyProduct } = require('./taxCalculator');

const MAX_CANNABIS_GRAMS = 30.0;

/**
 * Extract dried cannabis equivalent grams (DFE) from a product or line item
 * @param {Object} item - Product or cart item
 * @returns {number} Grams equivalent (0 for nicotine/accessories)
 */
function getProductCannabisGrams(item = {}) {
  // 1. Immediately return 0 for non-cannabis items (Nicotine, Accessories)
  const classification = classifyProduct(item);
  if (classification !== 'cannabis') {
    return 0.00;
  }

  // 2. Check official equivalent_g or dfe properties
  const rawEq =
    item.equivalent_g !== undefined && item.equivalent_g !== null
      ? item.equivalent_g
      : item.dfe !== undefined && item.dfe !== null
      ? item.dfe
      : item.product?.equivalent_g !== undefined && item.product?.equivalent_g !== null
      ? item.product?.equivalent_g
      : item.product?.dfe;

  if (rawEq !== undefined && rawEq !== null && rawEq !== '') {
    const parsed = Number(rawEq);
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed * 100) / 100;
    }
  }

  // 3. Check multipack pattern in name or size (e.g. "10 x 0.35g" or "10x0.35g" or "3x0.5g")
  const searchString = `${item.product_name || item.name || item.product?.name || item.product?.product_name || ''} ${item.size || item.weight || item.product?.size || item.variant?.label || ''}`;
  const multiMatch = searchString.match(/(\d+)\s*(?:x|\*)\s*(\d+(?:\.\d+)?)\s*g\b/i);
  if (multiMatch) {
    const count = parseInt(multiMatch[1], 10);
    const weightEach = parseFloat(multiMatch[2]);
    if (Number.isFinite(count) && Number.isFinite(weightEach) && count > 0 && weightEach > 0) {
      return Math.round(count * weightEach * 100) / 100;
    }
  }

  // 4. Check single gram pattern (e.g. "3.5g", "7g", "14g", "28g", "0.5g", "1g")
  const singleMatch = searchString.match(/\b(\d+(?:\.\d+)?)\s*g\b/i);
  if (singleMatch) {
    const grams = parseFloat(singleMatch[1]);
    if (Number.isFinite(grams) && grams > 0) {
      return Math.round(grams * 100) / 100;
    }
  }

  // 5. Default fallback for cannabis products where exact weight is unspecified
  return 1.00;
}

/**
 * Calculate total cannabis grams in a collection of cart / order items
 * @param {Array} items
 * @returns {number} Total grams of cannabis in items
 */
function calculateCartCannabisGrams(items = []) {
  if (!Array.isArray(items) || items.length === 0) return 0.00;

  let totalGrams = 0;
  for (const item of items) {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const gramsPerUnit = getProductCannabisGrams(item);
    totalGrams += gramsPerUnit * qty;
  }

  return Math.round(totalGrams * 100) / 100;
}

/**
 * Validate order items against the cannabis purchase limit
 * @param {Array} items
 * @param {number} [maxLimit=MAX_CANNABIS_GRAMS] Configurable limit in grams
 * @returns {{ valid: boolean, totalGrams: number, maxGrams: number, excessGrams: number, message: string|null }}
 */
function validateCannabisLimit(items = [], maxLimit = MAX_CANNABIS_GRAMS) {
  const effectiveMax = Number(maxLimit) > 0 ? Number(maxLimit) : MAX_CANNABIS_GRAMS;
  const totalGrams = calculateCartCannabisGrams(items);
  const valid = totalGrams <= effectiveMax;
  const excessGrams = valid ? 0 : Math.round((totalGrams - effectiveMax) * 100) / 100;

  return {
    valid,
    totalGrams,
    maxGrams: effectiveMax,
    excessGrams,
    message: valid
      ? null
      : `Order exceeds the ${effectiveMax.toFixed(1)}g legal limit for cannabis products. Current total: ${totalGrams.toFixed(1)}g (Limit: ${effectiveMax.toFixed(1)}g). Please reduce items by ${excessGrams.toFixed(1)}g to proceed.`,
  };
}

module.exports = {
  MAX_CANNABIS_GRAMS,
  getProductCannabisGrams,
  calculateCartCannabisGrams,
  validateCannabisLimit,
};

