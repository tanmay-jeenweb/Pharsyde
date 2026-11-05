const crypto = require('crypto');
const OtpModel = require('../models/otpModel');
const UserModel = require('../models/userModel');
const { sendOtpEmail } = require('../services/emailService');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COOLDOWN_SECONDS = 60;

/**
 * @route   POST /api/auth/otp/send
 * @desc    Generate and email 6-digit OTP for registration or guest checkout
 * @access  Public
 */
const sendOtp = async (req, res, next) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    if (!purpose || !['customer_register', 'guest_checkout'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification purpose specified.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check account existence based on purpose
    const existingUser = await UserModel.findByEmail(cleanEmail);

    if (purpose === 'customer_register') {
      // If user exists and already has a password set, they should log in
      if (existingUser && existingUser.password_set !== 0 && existingUser.password_set !== false) {
        return res.status(400).json({
          success: false,
          code: 'ACCOUNT_EXISTS',
          message: 'An account with this email already exists. Please sign in instead.',
        });
      }
    }

    // Check rate limit / cooldown (60 seconds)
    const secondsSinceLast = await OtpModel.getSecondsSinceLastOtp(cleanEmail, purpose);
    if (secondsSinceLast < COOLDOWN_SECONDS) {
      const remainingSeconds = COOLDOWN_SECONDS - secondsSinceLast;
      return res.status(429).json({
        success: false,
        code: 'COOLDOWN_ACTIVE',
        remainingSeconds,
        message: `Please wait ${remainingSeconds} seconds before requesting a new verification code.`,
      });
    }

    // Generate random 6-digit numeric OTP (100000 - 999999)
    const otp = crypto.randomInt(100000, 1000000).toString();
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;

    // Save to database
    await OtpModel.createOtp({
      email: cleanEmail,
      otp,
      purpose,
      ipAddress,
    });

    // Send email via Nodemailer
    await sendOtpEmail({
      to: cleanEmail,
      otp,
      purpose,
    });

    return res.status(200).json({
      success: true,
      message: `Verification code sent to ${cleanEmail}. Please check your inbox.`,
      cooldownSeconds: COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error('[OtpController] sendOtp error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/auth/otp/verify
 * @desc    Validate 6-digit OTP and issue a verification token
 * @access  Public
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and verification code are required.',
      });
    }

    if (!purpose || !['customer_register', 'guest_checkout'].includes(purpose)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification purpose specified.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    const result = await OtpModel.verifyOtp({
      email: cleanEmail,
      otp: cleanOtp,
      purpose,
    });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      verificationToken: result.verificationToken,
      message: result.message,
    });
  } catch (error) {
    console.error('[OtpController] verifyOtp error:', error);
    next(error);
  }
};

module.exports = {
  sendOtp,
  verifyOtp,
};

