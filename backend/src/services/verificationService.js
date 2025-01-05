// src/services/verificationService.js
const crypto = require('crypto');
const { executeQuery } = require('../config/DB/db');
const emailService = require('./emailService');
const logger = require('../config/logger');
const config = require('../config/config');

/**
 * Generate a random verification token
 * @returns {string} Random token
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Create a verification record for a user
 * @param {number} userId - User ID
 * @returns {Promise<string>} Verification token
 */
const createVerification = async (userId) => {
  try {
    // Generate a verification token
    const token = generateVerificationToken();

    // Set expiration time (24 hours from now)
    const expirationDate = new Date();
    expirationDate.setHours(expirationDate.getHours() + 24);

    // Format the date as an ISO string that SQL Server can handle
    const formattedExpirationDate = expirationDate.toISOString().slice(0, 19).replace('T', ' ');

    // Store verification token in database
    const query = `
      INSERT INTO EmailVerification (user_id, verification_token, expiration, is_verified)
      VALUES (@userId, @token, @expiration, 0);
    `;

    await executeQuery(query, {
      userId,
      token,
      expiration: formattedExpirationDate
    });

    logger.info(`Created verification token for user ID: ${userId}`);

    return token;
  } catch (error) {
    logger.error(`Error creating verification token: ${error.message}`);
    throw error;
  }
};

/**
 * Send verification email to user
 * @param {string} email - User's email address
 * @param {string} name - User's name
 * @param {string} token - Verification token
 * @returns {Promise<void>}
 */
const sendVerificationEmail = async (email, name, token) => {
  try {
    const verificationUrl = `http://localhost:5174/verify-email?token=${token}`;

    const emailOptions = {
      to: email,
      subject: 'Verify Your Email - Siyoga Travels',
      text: `
        Hello ${name},

        Thank you for registering with Siyoga Travels. Please verify your email address by clicking the link below:

        ${verificationUrl}

        This link will expire in 24 hours.

        If you did not create an account, please ignore this email.

        Best regards,
        The Siyoga Travels Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a6ee0;">Siyoga Travels</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with Siyoga Travels. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #4a6ee0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email Address</a>
          </div>
          <p>This link will expire in 24 hours.</p>
          <p>If you did not create an account, please ignore this email.</p>
          <p>Best regards,<br>The Siyoga Travels Team</p>
        </div>
      `
    };

    await emailService.sendEmail(emailOptions);
    logger.info(`Verification email sent to: ${email}`);
  } catch (error) {
    logger.error(`Error sending verification email: ${error.message}`);
    throw error;
  }
};

/**
 * Verify a user's email with the provided token
 * @param {string} token - Verification token
 * @returns {Promise<boolean>} Success status
 */
const verifyEmail = async (token) => {
  try {
    // Find the verification record
    const findQuery = `
      SELECT v.verification_id, v.user_id, v.expiration, u.email, u.full_name
      FROM EmailVerification v
      JOIN Users u ON v.user_id = u.user_id
      WHERE v.verification_token = @token AND v.is_verified = 0
    `;

    const result = await executeQuery(findQuery, { token });

    if (!result.recordset || result.recordset.length === 0) {
      logger.warn(`Invalid verification token: ${token}`);
      return { success: false, message: 'Invalid verification token' };
    }

    const verification = result.recordset[0];

    // Check if token is expired
    if (new Date(verification.expiration) < new Date()) {
      logger.warn(`Expired verification token for user ID: ${verification.user_id}`);
      return { success: false, message: 'Verification link has expired' };
    }

    // Update verification status
    const updateQuery = `
      UPDATE EmailVerification
      SET is_verified = 1
      WHERE verification_id = @verificationId;
    `;

    await executeQuery(updateQuery, { verificationId: verification.verification_id });

    logger.info(`Email verified for user ID: ${verification.user_id}`);

    return {
      success: true,
      message: 'Email verified successfully',
      user: {
        userId: verification.user_id,
        email: verification.email,
        name: verification.full_name
      }
    };
  } catch (error) {
    logger.error(`Error verifying email: ${error.message}`);
    throw error;
  }
};

module.exports = {
  createVerification,
  sendVerificationEmail,
  verifyEmail
};
