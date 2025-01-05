// src/utils/errorHandler.js
const logger = require('../config/logger');

// Custom Error class for API errors
class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Function to handle errors in async route handlers
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Error occurred:', err);

  if (err.originalError) {
    logger.error('Original error:', err.originalError);
  }

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File too large';
  } else if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Service unavailable';
  } else if (err.originalError && err.originalError.code) {
    // Handle database-specific errors
    switch (err.originalError.code) {
      case 'ELOGIN':
        statusCode = 500;
        message = 'Database login failed';
        break;
      case 'ETIMEOUT':
        statusCode = 504;
        message = 'Database connection timeout';
        break;
      case 'EREQUEST':
        statusCode = 400;
        message = 'Invalid database request';
        break;
      default:
        statusCode = 500;
        message = `Database error: ${err.message}`;
    }
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err.originalError ? {
        code: err.originalError.code,
        message: err.originalError.message
      } : undefined
    })
  });
};

// Handle 404 errors
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Not found - ${req.originalUrl}`);
  next(error);
};

module.exports = {
  ApiError,
  catchAsync,
  errorHandler,
  notFound
};