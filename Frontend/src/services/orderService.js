const API_BASE = '/api';

/**
 * Helper to build auth headers
 */
function getHeaders(token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };
  const activeToken = token || localStorage.getItem('pharsyde_customer_token');
  if (activeToken) {
    headers['Authorization'] = `Bearer ${activeToken}`;
  }
  return headers;
}

/**
 * Handle API responses cleanly
 */
async function handleResponse(res) {
  let data = {};
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned non-JSON response (${res.status} ${res.statusText})`);
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

/**
 * Place a new order
 */
export async function createOrderApi(orderPayload, token = null) {
  const url = `${API_BASE}/orders`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(orderPayload),
    });
    return await handleResponse(res);
  } catch (error) {
    // Development fallback to absolute localhost if proxy is bypassed
    if (!url.startsWith('http')) {
      try {
        const fallbackRes = await fetch(`http://localhost:5000/api/orders`, {
          method: 'POST',
          headers: getHeaders(token),
          body: JSON.stringify(orderPayload),
        });
        return await handleResponse(fallbackRes);
      } catch {}
    }
    throw error;
  }
}

/**
 * Get logged-in customer's order history
 */
export async function getMyOrdersApi(token = null, email = null) {
  let url = `${API_BASE}/orders`;
  if (email) {
    url += `?email=${encodeURIComponent(email)}`;
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await handleResponse(res);
    return data.orders || [];
  } catch (error) {
    if (!url.startsWith('http')) {
      try {
        const fallbackUrl = `http://localhost:5000/api/orders${email ? `?email=${encodeURIComponent(email)}` : ''}`;
        const fallbackRes = await fetch(fallbackUrl, {
          method: 'GET',
          headers: getHeaders(token),
        });
        const fallbackData = await handleResponse(fallbackRes);
        return fallbackData.orders || [];
      } catch {}
    }
    throw error;
  }
}

/**
 * Get single order details by ID or order_number
 */
export async function getOrderByIdApi(id, token = null) {
  const url = `${API_BASE}/orders/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await handleResponse(res);
    return data.order || null;
  } catch (error) {
    if (!url.startsWith('http')) {
      try {
        const fallbackRes = await fetch(`http://localhost:5000/api/orders/${encodeURIComponent(id)}`, {
          method: 'GET',
          headers: getHeaders(token),
        });
        const fallbackData = await handleResponse(fallbackRes);
        return fallbackData.order || null;
      } catch {}
    }
    throw error;
  }
}

/**
 * Customer Sign In
 */
export async function customerLoginApi({ email, password }) {
  const url = `${API_BASE}/auth/login`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await handleResponse(res);
  } catch (error) {
    if (!url.startsWith('http')) {
      try {
        const fallbackRes = await fetch(`http://localhost:5000/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        return await handleResponse(fallbackRes);
      } catch {}
    }
    throw error;
  }
}

/**
 * Customer Registration
 */
export async function customerRegisterApi({ name, email, password, phone, dateOfBirth }) {
  const url = `${API_BASE}/auth/register`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, phone, dateOfBirth }),
    });
    return await handleResponse(res);
  } catch (error) {
    if (!url.startsWith('http')) {
      try {
        const fallbackRes = await fetch(`http://localhost:5000/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, phone, dateOfBirth }),
        });
        return await handleResponse(fallbackRes);
      } catch {}
    }
    throw error;
  }
}

/**
 * Get Current Customer Profile
 */
export async function getCustomerProfileApi(token = null) {
  const url = `${API_BASE}/auth/me`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await handleResponse(res);
    return data.user || null;
  } catch (error) {
    if (!url.startsWith('http')) {
      try {
        const fallbackRes = await fetch(`http://localhost:5000/api/auth/me`, {
          method: 'GET',
          headers: getHeaders(token),
        });
        const fallbackData = await handleResponse(fallbackRes);
        return fallbackData.user || null;
      } catch {}
    }
    throw error;
  }
}

