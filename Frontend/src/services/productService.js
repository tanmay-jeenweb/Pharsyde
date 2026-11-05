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

  if (Array.isArray(category) && category.length > 0) {
    const validCats = category.filter((c) => c && c !== 'All');
    if (validCats.length > 0) {
      params.append('category', validCats.join(','));
    }
  } else if (category && category !== 'All') {
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
    // If running standalone or dev server without proxy, try absolute localhost:5000
    try {
      const fallbackUrl = `http://localhost:5000/api/products?${params.toString()}`;
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
      const fallbackUrl = `http://localhost:5000/api/products/meta/categories?hasImage=${hasImage ? 'true' : 'false'}`;
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
      const fallbackUrl = `http://localhost:5000/api/products/${encodeURIComponent(id)}`;
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
export async function syncImagesApi({ quick = false, maxPages, pageSize, sortId } = {}) {
  const url = `${API_BASE}/products/sync-images`;
  const bodyPayload = JSON.stringify({ quick, maxPages, pageSize, sortId });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyPayload,
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    try {
      const fallbackUrl = 'http://localhost:5000/api/products/sync-images';
      const resFallback = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyPayload,
      });
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
export async function syncAllApi({ quick = false, maxPages, pageSize, sortId } = {}) {
  const url = `${API_BASE}/products/sync-all`;
  const bodyPayload = JSON.stringify({ quick, maxPages, pageSize, sortId });

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyPayload,
    });
    if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    try {
      const fallbackUrl = 'http://localhost:5000/api/products/sync-all';
      const resFallback = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: bodyPayload,
      });
      if (resFallback.ok) {
        return await resFallback.json();
      }
    } catch {}
    throw error;
  }
}


/**
 * Fetch latest new arrivals products
 * Automatically applies the admin-configured limit unless overridden
 */
export async function getNewArrivalsProductsApi({ limit } = {}) {
  const params = new URLSearchParams();
  if (limit) params.append('limit', String(limit));

  const url = `${API_BASE}/products/new-arrivals${params.toString() ? '?' + params.toString() : ''}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    try {
      const fallbackUrl = `http://localhost:5000/api/products/new-arrivals${params.toString() ? '?' + params.toString() : ''}`;
      const resFallback = await fetch(fallbackUrl);
      if (resFallback.ok) {
        return await resFallback.json();
      }
    } catch {}
    throw error;
  }
}

/**
 * Fetch public settings (e.g. new_arrivals_limit)
 */
export async function getPublicSettingsApi() {
  const url = `${API_BASE}/settings/public`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    try {
      const fallbackUrl = 'http://localhost:5000/api/settings/public';
      const resFallback = await fetch(fallbackUrl);
      if (resFallback.ok) {
        return await resFallback.json();
      }
    } catch {}
    throw error;
  }
}


/**
 * Fetch configured best seller products
 */
export async function getBestSellersProductsApi() {
  const url = `${API_BASE}/products/best-sellers`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (error) {
    try {
      const fallbackUrl = 'http://localhost:5000/api/products/best-sellers';
      const resFallback = await fetch(fallbackUrl);
      if (resFallback.ok) {
        return await resFallback.json();
      }
    } catch {}
    throw error;
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

