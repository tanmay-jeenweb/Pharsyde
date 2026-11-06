const nodemailer = require('nodemailer');

function buildTransport(config) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    connectionTimeout: 4000,
    greetingTimeout: 4000,
  });
}

function getCandidateConfigs() {
  const primaryHost = process.env.SMTP_HOST || 'mail.pharsyde.jeenhost.in';
  const primaryPort = parseInt(process.env.SMTP_PORT || '465', 10);
  const primarySecure = process.env.SMTP_SECURE === 'true' || primaryPort === 465;
  const primaryUser = process.env.SMTP_USER || 'noreply@pharsyde.jeenhost.in';
  const primaryPass = process.env.SMTP_PASS || 'Jeenweb@123';

  const candidates = [
    // 1. Primary configured SMTP host
    {
      label: `Primary (${primaryHost}:${primaryPort})`,
      host: primaryHost,
      port: primaryPort,
      secure: primarySecure,
      user: primaryUser,
      pass: primaryPass,
    },
  ];

  // 2. If primary host is not the verified mail server, add it as backup fallback
  if (primaryHost !== 'mail.pharsyde.jeenhost.in') {
    candidates.push({
      label: 'Verified Backup Server (mail.pharsyde.jeenhost.in:465)',
      host: 'mail.pharsyde.jeenhost.in',
      port: 465,
      secure: true,
      user: 'noreply@pharsyde.jeenhost.in',
      pass: 'Jeenweb@123',
    });
  }

  return candidates;
}

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const primary = getCandidateConfigs()[0];
  cachedTransporter = buildTransport(primary);
  return cachedTransporter;
}

/**
 * Generate branded HTML email for OTP verification
 */
function generateOtpEmailHtml({ otp, purpose }) {
  const isRegister = purpose === 'customer_register';
  const title = isRegister ? 'Verify Your Customer Account' : 'Verify Your Guest Checkout';
  const description = isRegister
    ? 'Thank you for creating an account with Pharsyde Dispensary. Use the single-use verification code below to complete your registration and activate your membership.'
    : 'Thank you for shopping with Pharsyde Dispensary. To confirm your guest purchase and secure your order, please enter the single-use verification code below.';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f17; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0b0f17; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #111827; border: 1px solid #1e293b; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.5);" cellspacing="0" cellpadding="0">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="background: linear-gradient(90deg, #8EF705 0%, #488203 100%); height: 6px;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 36px 36px 20px 36px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; color: #ffffff;">
                PHAR<span style="color: #8EF705;">SYDE</span>
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8;">
                Winnipeg Craft Cannabis & Nicotine
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 10px 36px 30px 36px;">
              <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #ffffff; text-align: center;">
                ${title}
              </h2>
              <p style="margin: 0 0 28px 0; font-size: 14px; line-height: 1.6; color: #cbd5e1; text-align: center;">
                ${description}
              </p>

              <!-- OTP Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
                <tr>
                  <td align="center">
                    <div style="background-color: #030712; border: 2px dashed #8EF705; border-radius: 16px; padding: 22px 32px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #8EF705; display: block; margin-left: 10px;">
                        ${otp}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Notice info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #1e293b; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 12px; line-height: 1.5; color: #94a3b8; text-align: center;">
                    ⏱️ This verification code is valid for <strong>10 minutes</strong>. Do not share this code with anyone.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #64748b; text-align: center;">
                If you did not request this verification code, please ignore this email or reach out to our team immediately.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0b0f17; padding: 24px 36px; text-align: center; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b;">
                Pharsyde Retail Dispensary • 117 Regent Ave W, Winnipeg, MB
              </p>
              <p style="margin: 0; font-size: 10px; color: #475569;">
                Regulated Manitoba 19+ Adult Use Only • © ${new Date().getFullYear()} PHARSYDE Inc.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Send 6-digit OTP code to recipient email with automatic connection fallback
 */
async function sendOtpEmail({ to, otp, purpose }) {
  const isRegister = purpose === 'customer_register';
  const subject = isRegister
    ? `Your Pharsyde Account Verification Code: ${otp}`
    : `Your Pharsyde Order Verification Code: ${otp}`;

  const html = generateOtpEmailHtml({ otp, purpose });
  const from = process.env.SMTP_FROM || '"PHARSYDE Dispensary" <noreply@pharsyde.ca>';

  const candidates = getCandidateConfigs();
  let lastError = null;

  for (let i = 0; i < candidates.length; i++) {
    const config = candidates[i];
    try {
      const transport = buildTransport(config);
      const info = await transport.sendMail({
        from,
        to,
        subject,
        text: `Your Pharsyde verification code is: ${otp}. It will expire in 10 minutes.`,
        html,
      });

      // Output to both stdout and stderr so it appears in cPanel stderr log viewer
      const successMsg = `[EmailService] OTP sent successfully to ${to} via ${config.label} | Server Response: ${info.response} | Message ID: ${info.messageId}`;
      console.log(successMsg);
      console.error(successMsg);

      cachedTransporter = transport;
      return { success: true, messageId: info.messageId, response: info.response };
    } catch (err) {
      lastError = err;
      console.warn(`[EmailService] Candidate [${config.label}] failed: ${err.message}`);
      // Continue to next candidate (e.g. localhost or backup host)
    }
  }

  console.error(`[EmailService] All SMTP candidates failed to send email to ${to}. Last error:`, lastError?.message);

  if (process.env.EMAIL_DEV_MODE === 'true' || process.env.NODE_ENV === 'development') {
    console.warn(`[EmailService] [DEV FALLBACK] Continuing because EMAIL_DEV_MODE is enabled. OTP: ${otp}`);
    return { success: true, devMode: true };
  }

  throw new Error(`Failed to deliver verification code email: ${lastError?.message || 'SMTP Connection Failed'}`);
}

module.exports = {
  sendOtpEmail,
  getTransporter,
};

