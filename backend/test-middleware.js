// test-middleware.js
// Test file to verify middleware and utilities
const jwt = require('jsonwebtoken');
const { generateToken, verifyToken } = require('./src/utils/tokenManager');
const { ApiError } = require('./src/utils/errorHandler');
const logger = require('./src/config/logger');
const config = require('./src/config/config');

// Mock user for testing
const mockUser = {
  UserID: 1,
  Role: 'Tourist',
  Name: 'Test User'
};

// Test token generation and verification
function testTokenManager() {
  logger.info('Testing Token Manager...');
  
  try {
    // Generate a token
    const token = generateToken(mockUser);
    logger.info(`Generated token: ${token.substring(0, 15)}...`);
    
    // Verify the token
    const decoded = verifyToken(token);
    logger.info('Token verified successfully.');
    logger.info(`Decoded token:`, decoded);
    
    // Check if token contains expected data
    if (decoded.userId === mockUser.UserID && decoded.role === mockUser.Role) {
      logger.info('Token contains correct user data ✓');
    } else {
      logger.error('Token data mismatch ✗');
    }
    
    return true;
  } catch (error) {
    logger.error('Token test failed:', error);
    return false;
  }
}

// Test ApiError from errorHandler
function testApiError() {
  logger.info('\nTesting API Error...');
  
  try {
    // Create a new API error
    const error = new ApiError(404, 'Resource not found');
    
    // Check properties
    if (error.statusCode === 404 && 
        error.message === 'Resource not found' &&
        error.isOperational === true) {
      logger.info('ApiError created with correct properties ✓');
      return true;
    } else {
      logger.error('ApiError properties not as expected ✗');
      return false;
    }
  } catch (error) {
    logger.error('ApiError test failed:', error);
    return false;
  }
}

// Run tests
async function runTests() {
  logger.info('Starting middleware and utilities tests...');
  logger.info('-'.repeat(50));
  
  let passed = 0;
  let total = 2;
  
  // Test token manager
  if (testTokenManager()) {
    passed++;
  }
  
  // Test API Error
  if (testApiError()) {
    passed++;
  }
  
  // Show results
  logger.info('-'.repeat(50));
  logger.info(`Tests completed: ${passed}/${total} passed`);
  
  if (passed === total) {
    logger.info('All tests passed! Your middleware and utilities are working correctly.');
  } else {
    logger.error('Some tests failed. Please check the error messages above.');
  }
}

// Run all tests
runTests();