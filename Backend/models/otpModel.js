const pool = require('../config/db');
const crypto = require('crypto');

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp).trim()).digest('hex');
}

function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

const OtpModel = {
  /**
   * Check cooldown time (in seconds) since last OTP was sent for this email/purpose
   */
  async getSecondsSinceLastOtp(email, purpose) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const [rows] = await pool.query(
      `SELECT created_at FROM email_otps
       WHERE email = ? AND purpose = ?
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, purpose]
    );

    if (rows.length === 0) return 999999;
    const lastSent = new Date(rows[0].created_at).getTime();
    const diffSeconds = Math.floor((Date.now() - lastSent) / 1000);
    return diffSeconds;
  },

  /**
   * Create a new OTP entry in email_otps
   */
  async createOtp({ email, otp, purpose, ipAddress = null }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const otpHash = hashOtp(otp);

    // Invalidate any existing unused OTPs for this email and purpose
    await pool.query(
      `UPDATE email_otps SET is_verified = FALSE, expires_at = NOW()
       WHERE email = ? AND purpose = ? AND is_verified = FALSE`,
      [cleanEmail, purpose]
    );

    // 10 minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    const [result] = await pool.query(
      `INSERT INTO email_otps (email, otp_hash, purpose, attempts, max_attempts, is_verified, expires_at, ip_address)
       VALUES (?, ?, ?, 0, 5, FALSE, ?, ?)`,
      [cleanEmail, otpHash, purpose, expiresAt, ipAddress]
    );

    return result.insertId;
  },

  /**
   * Verify an entered OTP code
   */
  async verifyOtp({ email, otp, purpose }) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const otpHash = hashOtp(otp);

    const [rows] = await pool.query(
      `SELECT * FROM email_otps
       WHERE email = ? AND purpose = ? AND is_verified = FALSE
       ORDER BY created_at DESC LIMIT 1`,
      [cleanEmail, purpose]
    );

    if (rows.length === 0) {
      return { success: false, message: 'No verification code was requested for this email. Please request a new code.' };
    }

    const record = rows[0];

    // Check expiration
    if (new Date() > new Date(record.expires_at)) {
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }

    // Check attempts limit
    if (record.attempts >= record.max_attempts) {
      return { success: false, message: 'Too many incorrect attempts. Please request a new verification code.' };
    }

    // Verify hash
    if (record.otp_hash !== otpHash) {
      await pool.query(`UPDATE email_otps SET attempts = attempts + 1 WHERE id = ?`, [record.id]);
      const remaining = record.max_attempts - (record.attempts + 1);
      return {
        success: false,
        message: remaining > 0
          ? `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Incorrect verification code. Maximum attempts reached. Please request a new code.',
      };
    }

    // Mark as verified & issue token (valid for 30 minutes)
    const verificationToken = generateVerificationToken();
    const tokenExpiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await pool.query(
      `UPDATE email_otps
       SET is_verified = TRUE,
           verified_at = NOW(),
           verification_token = ?,
           expires_at = ?
       WHERE id = ?`,
      [verificationToken, tokenExpiresAt, record.id]
    );

    return {
      success: true,
      verificationToken,
      message: 'Email successfully verified.',
    };
  },

  /**
   * Validate that a given verification_token is legitimate, matches email & purpose, and is not expired
   */
  async validateVerificationToken({ email, purpose, verificationToken }) {
    if (!verificationToken || !email) return false;
    const cleanEmail = (email || '').trim().toLowerCase();

    const [rows] = await pool.query(
      `SELECT id, expires_at FROM email_otps
       WHERE email = ? AND purpose = ? AND verification_token = ? AND is_verified = TRUE
       ORDER BY verified_at DESC LIMIT 1`,
      [cleanEmail, purpose, verificationToken]
    );

    if (rows.length === 0) return false;

    // Check if verification token expired (30 min lifetime)
    const record = rows[0];
    if (new Date() > new Date(record.expires_at)) {
      return false;
    }

    return true;
  },

  /**
   * Consume / invalidate token after final use (registration or checkout)
   */
  async consumeVerificationToken(verificationToken) {
    if (!verificationToken) return;
    await pool.query(
      `UPDATE email_otps SET expires_at = NOW() WHERE verification_token = ?`,
      [verificationToken]
    );
  }
};

module.exports = OtpModel;

