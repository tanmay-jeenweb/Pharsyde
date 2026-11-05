/**
 * Centralized API & Host Configuration
 *
 * Configurable via Vite environment variables:
 * - VITE_API_URL / VITE_API_BASE_URL: Backend URL (e.g., "http://localhost:5000" or "https://api.yourdomain.com")
 *   If left blank, defaults to '/api' which works seamlessly with Vite dev proxy and relative production URLs.
 * - VITE_BACKEND_URL: Optional direct fallback host for local development.
 */

const rawApiUrl = (
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''
).replace(/\/+$/, '');

export const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

export const OFFICE_API_BASE = `${API_BASE}/office`;
export const PAYMENT_API_BASE = `${API_BASE}/payments/moneris`;
export const UPLOAD_API_BASE = `${API_BASE}/upload`;

// Fallback base URL for development when Vite proxy is not used
const rawBackend = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/+$/, '');
export const FALLBACK_API_BASE = rawBackend
  ? (rawBackend.endsWith('/api') ? rawBackend : `${rawBackend}/api`)
  : null;

