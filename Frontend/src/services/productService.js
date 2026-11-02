const API_BASE = '/api';

/**
 * Fetch products from the backend with filtering, pagination, and sorting.
 * Defaults to hasImage=true to include only products with images.
 */
export async function getProductsApi({
  category = '',
  search = '',
  page = 1,
  limit = 24,
  sortBy = 'modified',
  sortOrder = 'DESC',
  hasImage = true
} = {}) {
  const offset = (page - 1) * limit;
  const params = new URLSearchParams();

  if (category && category !== 'All') {
    params.append('category', category);
  }
  if (search.trim()) {
    params.append('search', search.trim());
  }
  if (hasImage) {
    params.append('hasImage', 'true');
  }
  params.append('limit', String(limit));
  params.append('offset', String(offset));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  const url = `${API_BASE}/products?${params.toString()}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (error) {
    // If running standalone or dev server without proxy, try absolute localhost:5001
    try {
      const fallbackUrl = `http://localhost:5001/api/products?${params.toString()}`;
      const resFallback = await fetch(fallbackUrl);
      if (resFallback.ok) {
        return await resFallback.json();
      }
    } catch {}
    throw error;
  }
}

/**
 * Fetch distinct categories from the backend (with hasImage=true)
 */
export async function getCategoriesApi({ hasImage = true } = {}) {
  const url = `${API_BASE}/products/meta/categories?hasImage=${hasImage ? 'true' : 'false'}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.categories || [];
  } catch (error) {
    try {
      const fallbackUrl = `http://localhost:5001/api/products/meta/categories?hasImage=${hasImage ? 'true' : 'false'}`;
      const resFallback = await fetch(fallbackUrl);
      if (resFallback.ok) {
        const data = await resFallback.json();
        return data.categories || [];
      }
    } catch {}
    throw error;
  }
}

/**
 * Fetch a single product by pk, sku, or barcode
 */
export async function getProductByIdApi(id) {
  if (!id) return null;
  const url = `${API_BASE}/products/${encodeURIComponent(id)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.product || null;
  } catch (error) {
    try {
      const fallbackUrl = `http://localhost:5001/api/products/${encodeURIComponent(id)}`;
      const resFallback = await fetch(fallbackUrl);
      if (resFallback.ok) {
        return await resFallback.json();
      }
    } catch {}
    throw error;
  }
}

/**
 * Trigger base product catalog sync from TechPOS OpenAPI
 */
export async function syncProductsApi() {
  const url = `${API_BASE}/products/sync-techpos`;

  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    try {
      const fallbackUrl = 'http://localhost:5000/api/products/sync-techpos';
      const resFallback = await fetch(fallbackUrl, { method: 'POST' });
      if (resFallback.ok) {
        return await resFallback.json();
      }
    } catch {}
    throw error;
  }
}

/**
 * Trigger backend image sync from TechPOS WebMenu
 */
export async function syncImagesApi() {
  const url = `${API_BASE}/products/sync-images`;

  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    try {
      const fallbackUrl = 'http://localhost:5001/api/products/sync-images';
      const resFallback = await fetch(fallbackUrl, { method: 'POST' });
      if (resFallback.ok) {
        return await resFallback.json();
      }
    } catch {}
    throw error;
  }
}

/**
 * Trigger full sync (TechPOS base products + WebMenu images)
 */
export async function syncAllApi() {
  const url = `${API_BASE}/products/sync-all`;

  try {
    const res = await fetch(url, { method: 'POST' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    try {
      const fallbackUrl = 'http://localhost:5001/api/products/sync-all';
      const resFallback = await fetch(fallbackUrl, { method: 'POST' });
      if (resFallback.ok) {
        return await resFallback.json();
      }
    } catch {}
    throw error;
  }
}
