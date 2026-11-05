/**
 * Order & Customer Auth Service
 * Reads from centralized apiConfig (.env driven)
 */
import { API_BASE, FALLBACK_API_BASE } from './apiConfig';

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
 * Fetch helper with fallback support
 */
async function fetchWithFallback(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  try {
    return await fetch(url, options);
  } catch (error) {
    if (FALLBACK_API_BASE && FALLBACK_API_BASE !== API_BASE) {
      try {
        const fallbackUrl = `${FALLBACK_API_BASE}${endpoint}`;
        return await fetch(fallbackUrl, options);
      } catch {}
    }
    throw error;
  }
}

/**
 * Place a new order
 */
export async function createOrderApi(orderPayload, token = null) {
  const res = await fetchWithFallback('/orders', {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify(orderPayload),
  });
  return await handleResponse(res);
}

/**
 * Get logged-in customer's order history
 */
export async function getMyOrdersApi(token = null) {
  try {
    const res = await fetchWithFallback('/orders', {
      method: 'GET',
      headers: getHeaders(token),
    });
    const data = await handleResponse(res);
    return data.orders || [];
  } catch (error) {
    throw error;
  }
}

/**
 * Get single order details by ID or order_number
 */
export async function getOrderByIdApi(id, token = null) {
  const res = await fetchWithFallback(`/orders/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getHeaders(token),
  });
  const data = await handleResponse(res);
  return data.order || null;
}

/**
 * Customer Sign In
 */
export async function customerLoginApi({ email, password }) {
  const res = await fetchWithFallback('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return await handleResponse(res);
}

/**
 * Customer Registration
 */
export async function customerRegisterApi({ name, email, password, phone, dateOfBirth, verificationToken }) {
  const res = await fetchWithFallback('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password, phone, dateOfBirth, verificationToken }),
  });
  return await handleResponse(res);
}

/**
 * Get Current Customer Profile
 */
export async function getCustomerProfileApi(token = null) {
  const res = await fetchWithFallback('/auth/me', {
    method: 'GET',
    headers: getHeaders(token),
  });
  const data = await handleResponse(res);
  return data.user || null;
}

/**
 * Check if an email belongs to an existing registered user
 */
export async function checkEmailApi(email) {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) return { exists: false };

  const res = await fetchWithFallback(`/auth/check-email?email=${encodeURIComponent(cleanEmail)}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });
  return await handleResponse(res);
}

/**
 * Request a 6-digit OTP email
 * @param {{ email: string, purpose: 'customer_register' | 'guest_checkout' }}
 */
export async function sendOtpApi({ email, purpose }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const res = await fetchWithFallback('/auth/otp/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, purpose }),
  });
  return await handleResponse(res);
}

/**
 * Verify 6-digit OTP code and retrieve verificationToken
 * @param {{ email: string, otp: string, purpose: 'customer_register' | 'guest_checkout' }}
 */
export async function verifyOtpApi({ email, otp, purpose }) {
  const cleanEmail = (email || '').trim().toLowerCase();
  const cleanOtp = String(otp || '').trim();
  const res = await fetchWithFallback('/auth/otp/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: cleanEmail, otp: cleanOtp, purpose }),
  });
  return await handleResponse(res);
}
