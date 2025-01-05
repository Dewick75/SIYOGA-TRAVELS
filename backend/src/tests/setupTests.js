// Setup file for Jest tests

// Silence console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  // Keep error and warn for debugging test failures
  error: console.error,
  warn: console.warn,
};

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRY = '1h';
process.env.REFRESH_TOKEN_EXPIRY = '7d';
process.env.EMAIL_USER = 'test@example.com';
process.env.EMAIL_PASS = 'test-password';
process.env.EMAIL_HOST = 'smtp.example.com';
process.env.EMAIL_PORT = '587';
process.env.BASE_URL = 'http://localhost:3000';
process.env.NODE_ENV = 'test';
