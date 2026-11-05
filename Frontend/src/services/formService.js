const API_BASE = '/api/forms';

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

/**
 * Submit Contact Us form response to backend
 * @param {Object} payload - { name, email, phone, subject, message }
 */
export async function submitContactInquiryApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(res);
  } catch (error) {
    try {
      const fallbackUrl = 'http://localhost:5000/api/forms/contact';
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    } catch {}
    throw error;
  }
}

/**
 * Submit Newsletter subscription response to backend
 * @param {Object} payload - { email, consent, source }
 */
export async function subscribeNewsletterApi(payload) {
  try {
    const res = await fetch(`${API_BASE}/newsletter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await handleResponse(res);
  } catch (error) {
    try {
      const fallbackUrl = 'http://localhost:5000/api/forms/newsletter';
      const fallbackRes = await fetch(fallbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (fallbackRes.ok) {
        return await fallbackRes.json();
      }
    } catch {}
    throw error;
  }
}

