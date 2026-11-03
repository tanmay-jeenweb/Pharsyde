const crypto = require('crypto');

const GUEST_CHECKOUT_COOKIE = 'guest_checkout_token';
const GUEST_CHECKOUT_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24; // 24 hours

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Generate a cryptographically secure random token (32 bytes hex)
 */
function generateGuestCheckoutToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Generate SHA-256 hash of guest token
 */
function hashGuestCheckoutToken(token) {
  return crypto.createHash('sha256').update(cleanText(token)).digest('hex');
}

/**
 * Extract guest token from request (cookies or header)
 */
function getGuestCheckoutToken(req) {
  return (
    cleanText(req.cookies?.[GUEST_CHECKOUT_COOKIE]) ||
    cleanText(req.headers['x-guest-checkout-token'])
  );
}

/**
 * Timing-safe validation of guest token against stored SHA-256 hash
 */
function isGuestCheckoutTokenValid(token, expectedHash) {
  const normalizedHash = cleanText(expectedHash);
  if (!cleanText(token) || !normalizedHash) {
    return false;
  }

  const actual = Buffer.from(hashGuestCheckoutToken(token), 'hex');
  const expected = Buffer.from(normalizedHash, 'hex');

  if (actual.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expected);
}

/**
 * Attach guest cookie to Express response
 */
function setGuestCheckoutTokenCookie(res, token) {
  res.cookie(GUEST_CHECKOUT_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: GUEST_CHECKOUT_TOKEN_MAX_AGE_SECONDS * 1000,
  });
}

module.exports = {
  GUEST_CHECKOUT_COOKIE,
  GUEST_CHECKOUT_TOKEN_MAX_AGE_SECONDS,
  generateGuestCheckoutToken,
  hashGuestCheckoutToken,
  getGuestCheckoutToken,
  isGuestCheckoutTokenValid,
  setGuestCheckoutTokenCookie,
};

