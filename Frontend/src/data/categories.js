/**
 * Master Categories Specification
 * 
 * CANNABIS_CATEGORIES: Exact 16 categories approved for the Cannabis Collection.
 * Products in other categories (accessories, lighters, nicotine) are strictly excluded from the cannabis page.
 */

export const CANNABIS_CATEGORIES = [
  'CANNABIS PLANT SEEDS',
  'CARTRIDGE 510',
  'Disposable Vapes',
  'Dried Flower',
  'Edibles-Beverages Dried',
  'Edibles-Beverages Liquid',
  'Edibles-Candy/Chocolate/Confec',
  'Extracts Ingested',
  'Extracts Inhaled',
  'FORTIFIED PRE-ROLLED',
  'KIEF',
  'MILLED/BLENDED',
  'PRE-ROLLED',
  'THC POUCHES',
  'Topical Products',
  'Vape'
];

export const NICOTINE_CATEGORIES = [
  'Nicotine Closed Pods',
  'Nicotine E-Juice',
  'NICOTINE POUCHES / SNUS',
  'Nicotine Vapes',
  'vapes & e-juices',
  'vaping accessories'
];

/**
 * Check if a category name belongs to cannabis
 */
export function isCannabisCategory(cat) {
  if (!cat) return false;
  const normalized = String(cat).trim().toLowerCase();
  return CANNABIS_CATEGORIES.some((c) => c.toLowerCase() === normalized);
}

/**
 * Check if a category name belongs to nicotine
 */
export function isNicotineCategory(cat) {
  if (!cat) return false;
  const normalized = String(cat).trim().toLowerCase();
  return NICOTINE_CATEGORIES.some((c) => c.toLowerCase() === normalized);
}

