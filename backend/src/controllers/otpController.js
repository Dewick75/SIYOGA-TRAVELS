// backend/src/controllers/otpController.js
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { executeQuery } = require('../config/DB/db');
const { ApiError, catchAsync } = require('../utils/errorHandler');
const logger = require('../config/logger');

// In-memory store for OTPs (for simplicity)
// In a production environment, you would store these in a database with expiration
const otpStore = {};

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pqrsabcd613@gmail.com',
    pass: 'idiu gyou wpua dtqx'
  }
});

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP
 */
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Send OTP to email
 * @route POST /api/auth/send-otp
 */
const sendOtp = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  // Generate OTP
  const otp = generateOtp();

  // Store OTP with expiration time (10 minutes)
  otpStore[email] = {
    otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now
  };

  // Email content
  const mailOptions = {
    from: 'pqrsabcd613@gmail.com',
    to: email,
    subject: 'Your Verification Code - Siyoga Travels',
    text: `
      Hello,

      Your verification code for Siyoga Travels is: ${otp}

      This code will expire in 10 minutes.

      If you did not request this code, please ignore this email.

      Regards,
      Siyoga Travels Team
    `,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <h2 style="color: #3b82f6; text-align: center;">Siyoga Travels</h2>
        <h3 style="text-align: center;">Email Verification Code</h3>
        <p>Hello,</p>
        <p>Your verification code for Siyoga Travels is:</p>
        <div style="text-align: center; margin: 20px 0;">
          <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; padding: 10px 20px; background-color: #f3f4f6; border-radius: 5px;">${otp}</span>
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <p>Regards,<br>Siyoga Travels Team</p>
      </div>
    `
  };

  // Send email
  try {
    await transporter.sendMail(mailOptions);
    logger.info(`OTP sent to email: ${email}`);

    res.json({
      success: true,
      message: 'OTP sent to email successfully'
    });
  } catch (error) {
    logger.error(`Error sending OTP email: ${error.message}`);
    throw new ApiError(500, 'Failed to send OTP email');
  }
});

/**
 * Verify OTP and update verification status in database
 * @route POST /api/auth/verify-otp
 */
const verifyOtp = catchAsync(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, 'Email and OTP are required');
  }

  // Check if OTP exists for the email
  if (!otpStore[email]) {
    throw new ApiError(400, 'No OTP found for this email. Please request a new OTP');
  }

  // Check if OTP is expired
  if (new Date() > new Date(otpStore[email].expiresAt)) {
    // Remove expired OTP
    delete otpStore[email];
    throw new ApiError(400, 'OTP has expired. Please request a new OTP');
  }

  // Verify OTP
  if (otpStore[email].otp !== otp) {
    throw new ApiError(400, 'Invalid OTP. Please try again');
  }

  // OTP is valid, remove it from store
  delete otpStore[email];

  try {
    // Find the user by email
    const userQuery = `
      SELECT user_id
      FROM Users
      WHERE email = @email
    `;

    const userResult = await executeQuery(userQuery, { email });

    if (!userResult.recordset || userResult.recordset.length === 0) {
      logger.warn(`User not found for email: ${email} during OTP verification`);
      // Don't throw an error here, as the OTP verification itself was successful
      // The user might be in the process of registering and not yet in the database
    } else {
      const userId = userResult.recordset[0].user_id;

      // Check if verification record exists
      const checkVerificationQuery = `
        SELECT verification_id
        FROM EmailVerification
        WHERE user_id = @userId
      `;

      const verificationResult = await executeQuery(checkVerificationQuery, { userId });

      if (verificationResult.recordset && verificationResult.recordset.length > 0) {
        // Update existing verification record
        const updateQuery = `
          UPDATE EmailVerification
          SET is_verified = 1
          WHERE user_id = @userId
        `;

        await executeQuery(updateQuery, { userId });
        logger.info(`Updated verification status for user ID: ${userId}`);
      } else {
        // Create new verification record with is_verified = 1
        const insertQuery = `
          INSERT INTO EmailVerification (user_id, verification_token, expiration, is_verified)
          VALUES (@userId, @token, @expiration, 1)
        `;

        const token = crypto.randomBytes(32).toString('hex');
        const expiration = new Date();
        expiration.setHours(expiration.getHours() + 24);
        const formattedExpiration = expiration.toISOString().slice(0, 19).replace('T', ' ');

        await executeQuery(insertQuery, {
          userId,
          token,
          expiration: formattedExpiration
        });
        logger.info(`Created verification record with verified status for user ID: ${userId}`);
      }
    }
  } catch (dbError) {
    // Log the error but don't fail the OTP verification
    logger.error(`Error updating verification status: ${dbError.message}`);
    logger.error(dbError.stack);
  }

  logger.info(`Email verified with OTP: ${email}`);

  res.json({
    success: true,
    message: 'Email verified successfully'
  });
});

module.exports = {
  sendOtp,
  verifyOtp
};
