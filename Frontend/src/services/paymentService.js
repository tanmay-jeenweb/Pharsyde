const API_BASE = '/api/payments/moneris';
const SESSION_KEY = 'pharsyde_moneris_session';

/**
 * Preload payment session and request Moneris ticket from backend
 */
export async function preloadPaymentApi(checkoutData, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/preload`, {
    method: 'POST',
    headers,
    body: JSON.stringify(checkoutData),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    const error = new Error(data.message || 'Failed to initialize payment session.');
    error.code = data.code;
    error.status = res.status;
    throw error;
  }

  return data;
}

/**
 * Authoritatively finalize payment attempt after customer submits card in Moneris iframe
 */
export async function finalizePaymentApi({ paymentAttemptId, ticket }, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/finalize`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ paymentAttemptId, ticket }),
  });

  const data = await res.json();
  if (!res.ok || !data.success) {
    const error = new Error(data.message || 'Payment finalization failed.');
    error.code = data.code;
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Cancel payment attempt
 */
export async function cancelPaymentApi({ paymentAttemptId, ticket }) {
  try {
    const res = await fetch(`${API_BASE}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentAttemptId, ticket }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[Payment Cancel Warning]', err.message);
  }
}

/**
 * Retrieve recoverable session for /checkout/payment
 */
export async function getPaymentSessionApi(paymentAttemptId) {
  const res = await fetch(`${API_BASE}/session/${paymentAttemptId}`);
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Could not load payment session.');
  }
  return data;
}

/**
 * Storage helpers for Moneris session
 */
export function setMonerisPaymentSession(session) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (e) {
    console.warn('Could not save payment session to sessionStorage', e);
  }
}

export function getMonerisPaymentSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearMonerisPaymentSession() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch (e) {
    console.warn('Could not clear payment session', e);
  }
}

