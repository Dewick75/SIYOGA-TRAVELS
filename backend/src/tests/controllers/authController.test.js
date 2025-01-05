const { registerTourist } = require('../../controllers/authController');
const ApiError = require('../../utils/ApiError');
const bcrypt = require('bcrypt');
const logger = require('../../utils/logger');
const verificationService = require('../../services/verificationService');

// Mock dependencies
jest.mock('../../utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword')
}));

jest.mock('../../services/verificationService', () => ({
  createVerification: jest.fn().mockResolvedValue('verification-token'),
  sendVerificationEmail: jest.fn().mockResolvedValue(true)
}));

// Mock database query execution
jest.mock('../../utils/db', () => ({
  executeQuery: jest.fn().mockImplementation((query, params) => {
    // Mock email check query
    if (query.includes('SELECT user_id FROM Users WHERE email')) {
      if (params.email === 'existing@example.com') {
        return Promise.resolve({
          recordset: [{ user_id: 1 }]
        });
      }
      return Promise.resolve({
        recordset: []
      });
    }
    
    // Mock insert query
    if (query.includes('INSERT INTO Users')) {
      return Promise.resolve({
        recordset: [{ user_id: 2, tourist_id: 1 }]
      });
    }
    
    return Promise.resolve({
      recordset: []
    });
  })
}));

describe('Auth Controller - registerTourist', () => {
  let req, res, next;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup request, response and next function
    req = {
      body: {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        country: 'US',
        dateOfBirth: '1995-01-01',
        gender: 'Male',
        preferredLanguage: 'English',
        travelPreferences: JSON.stringify(['Adventure', 'Beach'])
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
  });
  
  test('should register a tourist successfully', async () => {
    await registerTourist(req, res, next);
    
    // Check if bcrypt was called
    expect(bcrypt.genSalt).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
    
    // Check if verification service was called
    expect(verificationService.createVerification).toHaveBeenCalled();
    expect(verificationService.sendVerificationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Test User',
      'verification-token'
    );
    
    // Check response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      message: expect.stringContaining('Tourist registered successfully'),
      data: expect.objectContaining({
        touristId: 1,
        email: 'test@example.com',
        verified: false
      })
    }));
  });
  
  test('should reject registration with existing email', async () => {
    req.body.email = 'existing@example.com';
    
    // Execute the controller function
    await registerTourist(req, res, next);
    
    // The next function should be called with an ApiError
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
    expect(next.mock.calls[0][0].message).toBe('Email already registered');
  });
  
  test('should validate required fields', async () => {
    // Remove required fields
    req.body = {
      email: 'test@example.com',
      password: 'password123'
    };
    
    // Execute the controller function
    await registerTourist(req, res, next);
    
    // The next function should be called with an ApiError
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
  
  test('should validate email format', async () => {
    req.body.email = 'invalid-email';
    
    // Execute the controller function
    await registerTourist(req, res, next);
    
    // The next function should be called with an ApiError
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
  
  test('should validate date of birth format', async () => {
    req.body.dateOfBirth = 'invalid-date';
    
    // Execute the controller function
    await registerTourist(req, res, next);
    
    // The next function should be called with an ApiError
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
  
  test('should validate gender values', async () => {
    req.body.gender = 'InvalidGender';
    
    // Execute the controller function
    await registerTourist(req, res, next);
    
    // The next function should be called with an ApiError
    expect(next).toHaveBeenCalledWith(expect.any(ApiError));
    expect(next.mock.calls[0][0].statusCode).toBe(400);
  });
  
  test('should handle database errors', async () => {
    // Mock a database error
    const db = require('../../utils/db');
    db.executeQuery.mockRejectedValueOnce(new Error('Database error'));
    
    // Execute the controller function
    await registerTourist(req, res, next);
    
    // The next function should be called with the error
    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(logger.error).toHaveBeenCalled();
  });
});
