// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { ApiError } = require('../utils/errorHandler');
const config = require('../config/config');
const { executeQuery } = require('../config/DB/db');

/**
 * Authentication middleware to protect routes
 * Verifies JWT token and sets user info in request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required. Please login.');
    }

    // Extract token from header
    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new ApiError(401, 'Authentication token missing');
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Check if user exists in the database - using TripBookingSystem schema
    const query = `
      SELECT
        U.user_id AS UserID,
        U.email AS Email,
        U.role AS Role,
        U.full_name AS Name,
        CASE
          WHEN U.role = 'traveler' THEN T.tourist_id
          WHEN U.role = 'driver' THEN D.driver_id
          ELSE NULL
        END AS RoleID
      FROM Users U
      LEFT JOIN Tourists T ON U.user_id = T.user_id AND U.role = 'traveler'
      LEFT JOIN Drivers D ON U.user_id = D.user_id AND U.role = 'driver'
      WHERE U.user_id = @userId
    `;

    const result = await executeQuery(query, { userId: decoded.userId });

    if (!result.recordset || !result.recordset[0]) {
      throw new ApiError(401, 'User not found');
    }

    // Add user info to request object
    req.user = result.recordset[0];

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token expired'));
    }

    if (error.name === 'JsonWebTokenError') {
      return next(new ApiError(401, 'Invalid token'));
    }

    next(error);
  }
};

/**
 * Role-based authorization middleware
 * @param {string|string[]} roles - Single role or array of allowed roles
 */
const authorize = (roles) => {
  // Convert string to array if a single role is provided
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Unauthorized'));
    }

    if (allowedRoles.length && !allowedRoles.includes(req.user.Role)) {
      return next(new ApiError(403, 'Forbidden: Insufficient privileges'));
    }

    next();
  };
};

/**
 * Tourist role check middleware
 */
const isTourist = (req, res, next) => {
  return authorize(['traveler'])(req, res, next);
};

/**
 * Driver role check middleware
 */
const isDriver = (req, res, next) => {
  return authorize(['driver'])(req, res, next);
};

/**
 * Admin role check middleware
 */
const isAdmin = (req, res, next) => {
  return authorize(['admin'])(req, res, next);
};

module.exports = {
  authenticate,
  authorize,
  isTourist,
  isDriver,
  isAdmin
};