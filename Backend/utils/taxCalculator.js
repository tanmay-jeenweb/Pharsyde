/**
 * Tax Calculator Utility
 * Calculates differential taxes based on product categories:
 * - Cannabis products: 5% GST (PST exempt in Manitoba) = 5% Total
 * - Nicotine products: 5% GST + 7% PST = 12% Total
 * - Accessories & other: 5% GST + 7% PST = 12% Total
 *
 * Supports proportional discount allocation (loyalty rewards / promo codes).
 */

const NICOTINE_CATEGORIES = new Set([
  'nicotine closed pods',
  'nicotine e-juice',
  'nicotine vapes',
  'vapes & e-juices',
]);

const ACCESSORY_CATEGORIES = new Set([
  'smoking accessories',
  'lighters',
  'accessories',
]);

const TAX_RATES = {
  CANNABIS: {
    gst: 0.05,
    pst: 0.00,
    total: 0.05,
  },
  NICOTINE: {
    gst: 0.05,
    pst: 0.07,
    total: 0.12,
  },
  ACCESSORY: {
    gst: 0.05,
    pst: 0.07,
    total: 0.12,
  },
  DEFAULT: {
    gst: 0.05,
    pst: 0.00,
    total: 0.05,
  },
};

/**
 * Classify product or line item into 'nicotine' | 'cannabis' | 'accessory'
 * @param {Object} item
 * @returns {'nicotine' | 'cannabis' | 'accessory'}
 */
function classifyProduct(item = {}) {
  const category = String(
    item.category ||
    item.subCategory ||
    item.product?.category ||
    item.product?.subCategory ||
    ''
  ).trim().toLowerCase();

  const productName = String(
    item.product_name ||
    item.name ||
    item.product?.name ||
    item.product?.product_name ||
    ''
  ).trim().toLowerCase();

  // 1. Explicit Nicotine check
  if (
    NICOTINE_CATEGORIES.has(category) ||
    category.includes('nicotine') ||
    productName.includes('nicotine') ||
    productName.includes('closed pods') ||
    productName.includes('e-juice')
  ) {
    return 'nicotine';
  }

  // 2. Explicit Accessory check
  if (ACCESSORY_CATEGORIES.has(category)) {
    return 'accessory';
  }

  // 3. Check isCannabis flags if available
  const rawIsCannabis =
    item.isCannabis !== undefined
      ? item.isCannabis
      : item.is_cannabis !== undefined
      ? item.is_cannabis
      : item.product?.isCannabis !== undefined
      ? item.product?.isCannabis
      : item.product?.is_cannabis;

  if (rawIsCannabis === false || rawIsCannabis === 'false' || rawIsCannabis === 0) {
    if (category.includes('accessory') || category.includes('lighter')) {
      return 'accessory';
    }
    return 'nicotine';
  }

  // Default to cannabis for cannabis store catalog
  return 'cannabis';
}

/**
 * Get tax rates for classified item
 * @param {'nicotine' | 'cannabis' | 'accessory'} classification
 * @returns {{ gst: number, pst: number, total: number }}
 */
function getTaxRate(classification) {
  return TAX_RATES[classification.toUpperCase()] ?? TAX_RATES.DEFAULT;
}

/**
 * Calculate order taxes in floating point dollars (for orderController and reports)
 * @param {Array} items - Line items
 * @param {Object} options
 * @param {number} [options.discount=0] - Dollar discount applied (e.g. loyalty points or promo)
 * @param {number} [options.shipping=0] - Shipping fee in dollars
 * @returns {Object} Tax and totals breakdown
 */
function calculateOrderTaxes(items = [], { discount = 0, shipping = 0 } = {}) {
  let cannabisSubtotal = 0;
  let nicotineSubtotal = 0;
  let accessorySubtotal = 0;

  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const unitPrice = Math.max(0, Number(item.unit_price ?? item.price ?? item.variant?.price ?? 0));
    const lineTotal = unitPrice * qty;

    const classification = classifyProduct(item);
    if (classification === 'nicotine') {
      nicotineSubtotal += lineTotal;
    } else if (classification === 'accessory') {
      accessorySubtotal += lineTotal;
    } else {
      cannabisSubtotal += lineTotal;
    }
  }

  const rawSubtotal = cannabisSubtotal + nicotineSubtotal + accessorySubtotal;
  const numDiscount = Math.max(0, Number(discount) || 0);
  const discountedSubtotal = Math.max(0, rawSubtotal - numDiscount);

  // Proportional discount ratio across all items
  const discountRatio = rawSubtotal > 0 ? discountedSubtotal / rawSubtotal : 1;

  // Cannabis: 5% GST + 0% PST = 5%
  const cannabisGst = Math.round(cannabisSubtotal * discountRatio * TAX_RATES.CANNABIS.gst * 100) / 100;
  const cannabisPst = 0;
  const cannabisTax = cannabisGst;

  // Nicotine: 5% GST + 7% PST = 12%
  const nicotineGst = Math.round(nicotineSubtotal * discountRatio * TAX_RATES.NICOTINE.gst * 100) / 100;
  const nicotinePst = Math.round(nicotineSubtotal * discountRatio * TAX_RATES.NICOTINE.pst * 100) / 100;
  const nicotineTax = Math.round((nicotineGst + nicotinePst) * 100) / 100;

  // Accessories: 5% GST + 7% PST = 12%
  const accessoryGst = Math.round(accessorySubtotal * discountRatio * TAX_RATES.ACCESSORY.gst * 100) / 100;
  const accessoryPst = Math.round(accessorySubtotal * discountRatio * TAX_RATES.ACCESSORY.pst * 100) / 100;
  const accessoryTax = Math.round((accessoryGst + accessoryPst) * 100) / 100;

  const totalGst = Math.round((cannabisGst + nicotineGst + accessoryGst) * 100) / 100;
  const totalPst = Math.round((cannabisPst + nicotinePst + accessoryPst) * 100) / 100;
  const totalTax = Math.round((totalGst + totalPst) * 100) / 100;

  const numShipping = Math.max(0, Number(shipping) || 0);
  const total = Math.max(0, Math.round((discountedSubtotal + totalTax + numShipping) * 100) / 100);

  return {
    rawSubtotal: Math.round(rawSubtotal * 100) / 100,
    discount: Math.round(numDiscount * 100) / 100,
    discountedSubtotal: Math.round(discountedSubtotal * 100) / 100,
    cannabisSubtotal: Math.round(cannabisSubtotal * 100) / 100,
    nicotineSubtotal: Math.round(nicotineSubtotal * 100) / 100,
    accessorySubtotal: Math.round(accessorySubtotal * 100) / 100,
    cannabisTax,
    cannabisGst,
    cannabisPst,
    nicotineTax,
    nicotineGst,
    nicotinePst,
    accessoryTax,
    accessoryGst,
    accessoryPst,
    gst: totalGst,
    pst: totalPst,
    tax: totalTax,
    totalTax,
    shipping: Math.round(numShipping * 100) / 100,
    total,
    hasCannabis: cannabisSubtotal > 0,
    hasNicotine: nicotineSubtotal > 0,
  };
}

/**
 * Calculate order taxes in integer cents (for paymentController & Moneris Checkout)
 * @param {Array} items - Line items with unit_price or unit_price_cents
 * @param {Object} options
 * @param {number} [options.discountCents=0] - Discount in integer cents
 * @param {number} [options.shippingCents=0] - Shipping in integer cents
 * @returns {Object} Tax breakdown in integer cents
 */
function calculateOrderTaxesCents(items = [], { discountCents = 0, shippingCents = 0 } = {}) {
  let cannabisSubtotalCents = 0;
  let nicotineSubtotalCents = 0;
  let accessorySubtotalCents = 0;

  for (const item of items) {
    const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
    const unitPriceCents =
      item.unit_price_cents !== undefined
        ? Number(item.unit_price_cents)
        : Math.round(Number(item.unit_price ?? item.price ?? item.variant?.price ?? 0) * 100);

    const lineTotalCents = unitPriceCents * qty;
    const classification = classifyProduct(item);

    if (classification === 'nicotine') {
      nicotineSubtotalCents += lineTotalCents;
    } else if (classification === 'accessory') {
      accessorySubtotalCents += lineTotalCents;
    } else {
      cannabisSubtotalCents += lineTotalCents;
    }
  }

  const rawSubtotalCents = cannabisSubtotalCents + nicotineSubtotalCents + accessorySubtotalCents;
  const numDiscountCents = Math.max(0, parseInt(discountCents, 10) || 0);
  const discountedSubtotalCents = Math.max(0, rawSubtotalCents - numDiscountCents);

  const discountRatio = rawSubtotalCents > 0 ? discountedSubtotalCents / rawSubtotalCents : 1;

  // Cannabis: 5% GST + 0% PST
  const cannabisGstCents = Math.round(cannabisSubtotalCents * discountRatio * TAX_RATES.CANNABIS.gst);
  const cannabisPstCents = 0;
  const cannabisTaxCents = cannabisGstCents;

  // Nicotine: 5% GST + 7% PST = 12%
  const nicotineGstCents = Math.round(nicotineSubtotalCents * discountRatio * TAX_RATES.NICOTINE.gst);
  const nicotinePstCents = Math.round(nicotineSubtotalCents * discountRatio * TAX_RATES.NICOTINE.pst);
  const nicotineTaxCents = nicotineGstCents + nicotinePstCents;

  // Accessories: 5% GST + 7% PST = 12%
  const accessoryGstCents = Math.round(accessorySubtotalCents * discountRatio * TAX_RATES.ACCESSORY.gst);
  const accessoryPstCents = Math.round(accessorySubtotalCents * discountRatio * TAX_RATES.ACCESSORY.pst);
  const accessoryTaxCents = accessoryGstCents + accessoryPstCents;

  const totalGstCents = cannabisGstCents + nicotineGstCents + accessoryGstCents;
  const totalPstCents = cannabisPstCents + nicotinePstCents + accessoryPstCents;
  const totalTaxCents = totalGstCents + totalPstCents;

  const numShippingCents = Math.max(0, parseInt(shippingCents, 10) || 0);
  const totalCents = discountedSubtotalCents + totalTaxCents + numShippingCents;

  return {
    rawSubtotalCents,
    discountCents: numDiscountCents,
    discountedSubtotalCents,
    cannabisSubtotalCents,
    nicotineSubtotalCents,
    accessorySubtotalCents,
    cannabisTaxCents,
    cannabisGstCents,
    cannabisPstCents,
    nicotineTaxCents,
    nicotineGstCents,
    nicotinePstCents,
    accessoryTaxCents,
    accessoryGstCents,
    accessoryPstCents,
    totalGstCents,
    totalPstCents,
    totalTaxCents,
    shippingCents: numShippingCents,
    totalCents,
    hasCannabis: cannabisSubtotalCents > 0,
    hasNicotine: nicotineSubtotalCents > 0,
  };
}

module.exports = {
  TAX_RATES,
  NICOTINE_CATEGORIES,
  ACCESSORY_CATEGORIES,
  classifyProduct,
  getTaxRate,
  calculateOrderTaxes,
  calculateOrderTaxesCents,
};
