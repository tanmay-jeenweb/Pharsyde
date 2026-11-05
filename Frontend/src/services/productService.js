/**
 * Product & Catalog Service
 * Reads from centralized apiConfig (.env driven)
 */
import { API_BASE, FALLBACK_API_BASE } from './apiConfig';

/**
 * Shared fetch helper with optional dev fallback
 */
async function fetchJsonWithFallback(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    if (FALLBACK_API_BASE && FALLBACK_API_BASE !== API_BASE) {
      try {
        const fallbackUrl = `${FALLBACK_API_BASE}${endpoint}`;
        const resFallback = await fetch(fallbackUrl, options);
        if (resFallback.ok) {
          return await resFallback.json();
        }
      } catch {}
    }
    throw error;
  }
}

/**
 * Fetch paginated & filtered products from backend
 */
export async function getProductsApi({
  category = '',
  brand = '',
  strain = '',
  minPrice = '',
  maxPrice = '',
  search = '',
  page = 1,
  limit = 24,
  hasImage = true,
  storeId,
  sortBy = 'featured',
  sortOrder = 'desc'
} = {}) {
  const params = new URLSearchParams();

  if (Array.isArray(category) && category.length > 0) {
    const validCats = category.filter((c) => c && c !== 'All');
    if (validCats.length > 0) {
      params.append('category', validCats.join(','));
    }
  } else if (category && category !== 'All') {
    params.append('category', category);
  }

  if (Array.isArray(brand) && brand.length > 0) {
    const validBrands = brand.filter(Boolean);
    if (validBrands.length > 0) {
      params.append('brand', validBrands.join(','));
    }
  } else if (brand && brand !== 'All') {
    params.append('brand', brand);
  }

  if (Array.isArray(strain) && strain.length > 0) {
    const validStrains = strain.filter(Boolean);
    if (validStrains.length > 0) {
      params.append('strain', validStrains.join(','));
    }
  } else if (strain && strain !== 'All') {
    params.append('strain', strain);
  }

  if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
    params.append('minPrice', String(minPrice));
  }
  if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
    params.append('maxPrice', String(maxPrice));
  }

  if (search.trim()) {
    params.append('search', search.trim());
  }

  params.append('page', String(page));
  params.append('limit', String(limit));

  if (hasImage) {
    params.append('hasImage', 'true');
  }

  if (storeId !== undefined) {
    params.append('storeId', String(storeId));
  }

  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  return await fetchJsonWithFallback(`/products?${params.toString()}`);
}

/**
 * Fetch distinct categories from the backend
 */
export async function getCategoriesApi({ hasImage = true } = {}) {
  try {
    const data = await fetchJsonWithFallback(`/products/meta/categories?hasImage=${hasImage ? 'true' : 'false'}`);
    return data.categories || [];
  } catch {
    return [];
  }
}

/**
 * Fetch distinct brands from the backend (optionally filtered by category)
 */
export async function getBrandsApi({ category = '', hasImage = true } = {}) {
  const params = new URLSearchParams();
  if (hasImage) params.append('hasImage', 'true');
  if (Array.isArray(category) && category.length > 0) {
    params.append('category', category.filter((c) => c && c !== 'All').join(','));
  } else if (category && category !== 'All') {
    params.append('category', category);
  }

  try {
    const data = await fetchJsonWithFallback(`/products/meta/brands?${params.toString()}`);
    return data.brands || [];
  } catch {
    return [];
  }
}

/**
 * Fetch distinct strains from the backend (optionally filtered by category)
 */
export async function getStrainsApi({ category = '', hasImage = true } = {}) {
  const params = new URLSearchParams();
  if (hasImage) params.append('hasImage', 'true');
  if (Array.isArray(category) && category.length > 0) {
    params.append('category', category.filter((c) => c && c !== 'All').join(','));
  } else if (category && category !== 'All') {
    params.append('category', category);
  }

  try {
    const data = await fetchJsonWithFallback(`/products/meta/strains?${params.toString()}`);
    return data.strains || [];
  } catch {
    return [];
  }
}

/**
 * Fetch a single product by pk, sku, or barcode
 */
export async function getProductByIdApi(id) {
  if (!id) return null;
  try {
    const data = await fetchJsonWithFallback(`/products/${encodeURIComponent(id)}`);
    return data.product || null;
  } catch {
    return null;
  }
}

/**
 * Trigger base product catalog sync from TechPOS OpenAPI
 */
export async function syncProductsApi() {
  return await fetchJsonWithFallback('/products/sync-techpos', { method: 'POST' });
}

/**
 * Trigger backend image sync from TechPOS WebMenu
 */
export async function syncImagesApi({ quick = false, maxPages, pageSize, sortId } = {}) {
  return await fetchJsonWithFallback('/products/sync-images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quick, maxPages, pageSize, sortId }),
  });
}

/**
 * Trigger full sync (TechPOS base products + WebMenu images)
 */
export async function syncAllApi({ quick = false, maxPages, pageSize, sortId } = {}) {
  return await fetchJsonWithFallback('/products/sync-all', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quick, maxPages, pageSize, sortId }),
  });
}

/**
 * Fetch latest new arrivals products
 */
export async function getNewArrivalsProductsApi({ limit } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));
  try {
    return await fetchJsonWithFallback(`/products/new-arrivals${params.toString() ? '?' + params.toString() : ''}`);
  } catch {
    return { success: false, products: [] };
  }
}

/**
 * Fetch public settings (e.g. cannabis_max_grams, new_arrivals_limit, free_delivery_threshold)
 */
export async function getPublicSettingsApi() {
  try {
    return await fetchJsonWithFallback(`/settings/public?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return {};
  }
}

/**
 * Fetch configured best seller products
 */
export async function getBestSellersProductsApi() {
  try {
    return await fetchJsonWithFallback('/products/best-sellers');
  } catch {
    return { success: false, products: [] };
  }
}

/**
 * Fetch dynamic storefront home page sections (active only, with hydrated products)
 */
export async function getPublicHomeSectionsApi() {
  const url = `${API_BASE}/products/home-sections`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    try {
      const fallbackUrl = 'http://localhost:5000/api/products/home-sections';
      const resFallback = await fetch(fallbackUrl);
      if (resFallback.ok) {
        return await resFallback.json();
      }
    } catch {}
    throw error;
  }
}

