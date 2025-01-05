// src/utils/tokenManager.js
const jwt = require('jsonwebtoken');
const config = require('../config/config');

/**
 * Generate JWT token for authentication
 * @param {Object} user - User object with id and role
 * @returns {String} - JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user.UserID,
    role: user.Role
  };

  return jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, config.jwt.secret);
};

/**
 * Generate refresh token with longer expiry
 * @param {Object} user - User object with id
 * @returns {String} - Refresh token
 */
const generateRefreshToken = (user) => {
  const payload = {
    userId: user.UserID,
    tokenType: 'refresh'
  };

  return jwt.sign(
    payload,
    config.jwt.secret,
    { expiresIn: '7d' } // Refresh token lasts for 7 days
  );
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
};