const API_BASE = '/api/office';

/**
 * Helper to build auth headers with Bearer token
 */
function getHeaders(contentType = 'application/json') {
  const headers = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  const token = localStorage.getItem('office_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Handle API responses and throw informative errors
 */
async function handleResponse(res) {
  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText})`);
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────

export async function loginOfficeApi({ username, password }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await handleResponse(res);
  if (data.token) {
    localStorage.setItem('office_token', data.token);
    localStorage.setItem('office_user', JSON.stringify(data.user));
    localStorage.setItem('office_permissions', JSON.stringify(data.permissions || []));
  }
  return data;
}

export function logoutOfficeApi() {
  localStorage.removeItem('office_token');
  localStorage.removeItem('office_user');
  localStorage.removeItem('office_permissions');
}

export function getStoredOfficeUser() {
  try {
    const u = localStorage.getItem('office_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
}

export function getStoredOfficePermissions() {
  try {
    const p = localStorage.getItem('office_permissions');
    return p ? JSON.parse(p) : [];
  } catch {
    return [];
  }
}

export async function getOfficeMeApi() {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────────────────────

export async function getDashboardStatsApi() {
  const res = await fetch(`${API_BASE}/stats`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────────────────────
// User Master
// ─────────────────────────────────────────────────────────────

export async function getOfficeUsersApi({ showInactive = false, search = '', userTypeId = '' } = {}) {
  const params = new URLSearchParams();
  if (showInactive) params.append('showInactive', 'true');
  if (search) params.append('search', search);
  if (userTypeId) params.append('userTypeId', userTypeId);

  const res = await fetch(`${API_BASE}/users?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getOfficeUserByIdApi(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function createOfficeUserApi(userData) {
  const res = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

export async function updateOfficeUserApi(id, userData) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(res);
}

export async function toggleOfficeUserActiveApi(id, active) {
  const res = await fetch(`${API_BASE}/users/${id}/toggle-active`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ active }),
  });
  return handleResponse(res);
}

export async function deleteOfficeUserApi(id) {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────────────────────
// User Type Master
// ─────────────────────────────────────────────────────────────

export async function getOfficeUserTypesApi() {
  const res = await fetch(`${API_BASE}/user-types`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getOfficeUserTypeByIdApi(id) {
  const res = await fetch(`${API_BASE}/user-types/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function createOfficeUserTypeApi(data) {
  const res = await fetch(`${API_BASE}/user-types`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function updateOfficeUserTypeApi(id, data) {
  const res = await fetch(`${API_BASE}/user-types/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function deleteOfficeUserTypeApi(id) {
  const res = await fetch(`${API_BASE}/user-types/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────────────────────
// Product Master
// ─────────────────────────────────────────────────────────────

export async function getOfficeProductsApi({
  search = '',
  category = '',
  brand = '',
  active = '',
  hasImage = '',
  limit = 50,
  offset = 0,
  sortBy = 'modified',
  sortOrder = 'DESC',
} = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (category && category !== 'all') params.append('category', category);
  if (brand && brand !== 'all') params.append('brand', brand);
  if (active !== '') params.append('active', active);
  if (hasImage !== '') params.append('hasImage', hasImage);
  params.append('limit', String(limit));
  params.append('offset', String(offset));
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function getOfficeProductByIdApi(id) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function createOfficeProductApi(productData) {
  const res = await fetch(`${API_BASE}/products`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(productData),
  });
  return handleResponse(res);
}

export async function updateOfficeProductApi(id, productData) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(productData),
  });
  return handleResponse(res);
}

export async function toggleOfficeProductActiveApi(id, active) {
  const res = await fetch(`${API_BASE}/products/${id}/toggle-active`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ active }),
  });
  return handleResponse(res);
}

export async function deleteOfficeProductApi(id) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: 'DELETE',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────────────────────
// Product Image Master
// ─────────────────────────────────────────────────────────────

export async function getOfficeProductImagesApi({ search = '', filter = 'all', limit = 50, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (filter && filter !== 'all') params.append('filter', filter);
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  const res = await fetch(`${API_BASE}/product-images?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

export async function updateOfficeProductImageApi(id, data) {
  const res = await fetch(`${API_BASE}/product-images/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function syncOfficeProductImagesApi() {
  const res = await fetch(`${API_BASE}/product-images/sync`, {
    method: 'POST',
    headers: getHeaders(),
  });
  return handleResponse(res);
}

// ─────────────────────────────────────────────────────────────
// Activity Report
// ─────────────────────────────────────────────────────────────

export async function getActivityLogsApi({ masterName = 'all', changeType = 'all', search = '', limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (masterName && masterName !== 'all') params.append('masterName', masterName);
  if (changeType && changeType !== 'all') params.append('changeType', changeType);
  if (search) params.append('search', search);
  params.append('limit', String(limit));
  params.append('offset', String(offset));

  const res = await fetch(`${API_BASE}/activity-logs?${params.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(res);
}

