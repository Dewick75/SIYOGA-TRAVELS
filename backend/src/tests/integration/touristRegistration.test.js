const request = require('supertest');
const app = require('../../app');
const db = require('../../utils/db');
const bcrypt = require('bcrypt');
const verificationService = require('../../services/verificationService');

// Mock dependencies
jest.mock('../../utils/db', () => ({
  executeQuery: jest.fn()
}));

jest.mock('bcrypt', () => ({
  genSalt: jest.fn().mockResolvedValue('salt'),
  hash: jest.fn().mockResolvedValue('hashedPassword')
}));

jest.mock('../../services/verificationService', () => ({
  createVerification: jest.fn().mockResolvedValue('verification-token'),
  sendVerificationEmail: jest.fn().mockResolvedValue(true)
}));

describe('Tourist Registration Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock database queries
    db.executeQuery.mockImplementation((query, params) => {
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
    });
  });
  
  test('should register a tourist successfully', async () => {
    const response = await request(app)
      .post('/api/auth/register/tourist')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        country: 'US',
        dateOfBirth: '1995-01-01',
        gender: 'Male',
        preferredLanguage: 'English',
        travelPreferences: JSON.stringify(['Adventure', 'Beach'])
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toEqual(expect.objectContaining({
      success: true,
      message: expect.stringContaining('Tourist registered successfully'),
      data: expect.objectContaining({
        touristId: 1,
        email: 'test@example.com',
        verified: false
      })
    }));
    
    // Verify that bcrypt was called
    expect(bcrypt.genSalt).toHaveBeenCalled();
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 'salt');
    
    // Verify that verification service was called
    expect(verificationService.createVerification).toHaveBeenCalled();
    expect(verificationService.sendVerificationEmail).toHaveBeenCalledWith(
      'test@example.com',
      'Test User',
      'verification-token'
    );
  });
  
  test('should reject registration with existing email', async () => {
    const response = await request(app)
      .post('/api/auth/register/tourist')
      .send({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        country: 'US',
        dateOfBirth: '1995-01-01',
        gender: 'Male',
        preferredLanguage: 'English'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({
      success: false,
      message: 'Email already registered'
    }));
  });
  
  test('should reject registration with missing required fields', async () => {
    const response = await request(app)
      .post('/api/auth/register/tourist')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({
      success: false
    }));
  });
  
  test('should reject registration with invalid email format', async () => {
    const response = await request(app)
      .post('/api/auth/register/tourist')
      .send({
        name: 'Test User',
        email: 'invalid-email',
        password: 'password123',
        phoneNumber: '+1234567890',
        country: 'US'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({
      success: false
    }));
  });
  
  test('should reject registration with invalid date of birth', async () => {
    const response = await request(app)
      .post('/api/auth/register/tourist')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        country: 'US',
        dateOfBirth: 'invalid-date',
        gender: 'Male'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({
      success: false
    }));
  });
  
  test('should reject registration with invalid gender', async () => {
    const response = await request(app)
      .post('/api/auth/register/tourist')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        country: 'US',
        dateOfBirth: '1995-01-01',
        gender: 'InvalidGender'
      });
    
    expect(response.status).toBe(400);
    expect(response.body).toEqual(expect.objectContaining({
      success: false
    }));
  });
  
  test('should handle database errors gracefully', async () => {
    // Mock a database error
    db.executeQuery.mockRejectedValueOnce(new Error('Database error'));
    
    const response = await request(app)
      .post('/api/auth/register/tourist')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phoneNumber: '+1234567890',
        country: 'US'
      });
    
    expect(response.status).toBe(500);
    expect(response.body).toEqual(expect.objectContaining({
      success: false
    }));
  });
});
