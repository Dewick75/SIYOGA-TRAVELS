const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/authRoutes');
const authController = require('../../controllers/authController');
const errorHandler = require('../../middleware/errorHandler');

// Mock the auth controller
jest.mock('../../controllers/authController', () => ({
  registerTourist: jest.fn((req, res, next) => {
    if (req.body.email === 'existing@example.com') {
      const error = new Error('Email already registered');
      error.statusCode = 400;
      return next(error);
    }
    
    if (!req.body.name || !req.body.email || !req.body.password) {
      const error = new Error('Missing required fields');
      error.statusCode = 400;
      return next(error);
    }
    
    res.status(201).json({
      success: true,
      message: 'Tourist registered successfully',
      data: {
        touristId: 1,
        email: req.body.email,
        verified: false
      }
    });
  }),
  
  verifyEmail: jest.fn((req, res, next) => {
    if (req.params.token === 'valid-token') {
      res.status(200).json({
        success: true,
        message: 'Email verified successfully'
      });
    } else {
      const error = new Error('Invalid or expired token');
      error.statusCode = 400;
      next(error);
    }
  }),
  
  login: jest.fn((req, res, next) => {
    if (req.body.email === 'test@example.com' && req.body.password === 'password123') {
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          token: 'jwt-token',
          user: {
            id: 1,
            email: 'test@example.com',
            role: 'tourist'
          }
        }
      });
    } else {
      const error = new Error('Invalid credentials');
      error.statusCode = 401;
      next(error);
    }
  })
}));

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('POST /api/auth/register/tourist', () => {
    test('should register a tourist successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register/tourist')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          phoneNumber: '+1234567890',
          country: 'US'
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        message: 'Tourist registered successfully'
      }));
      expect(authController.registerTourist).toHaveBeenCalled();
    });
    
    test('should return 400 for existing email', async () => {
      const response = await request(app)
        .post('/api/auth/register/tourist')
        .send({
          name: 'Existing User',
          email: 'existing@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        message: 'Email already registered'
      }));
    });
    
    test('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register/tourist')
        .send({
          email: 'test@example.com'
        });
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        message: 'Missing required fields'
      }));
    });
  });
  
  describe('GET /api/auth/verify/:token', () => {
    test('should verify email with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify/valid-token');
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        message: 'Email verified successfully'
      }));
      expect(authController.verifyEmail).toHaveBeenCalled();
    });
    
    test('should return 400 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify/invalid-token');
      
      expect(response.status).toBe(400);
      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        message: 'Invalid or expired token'
      }));
    });
  });
  
  describe('POST /api/auth/login', () => {
    test('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toEqual(expect.objectContaining({
        success: true,
        message: 'Login successful',
        data: expect.objectContaining({
          token: 'jwt-token'
        })
      }));
      expect(authController.login).toHaveBeenCalled();
    });
    
    test('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });
      
      expect(response.status).toBe(401);
      expect(response.body).toEqual(expect.objectContaining({
        success: false,
        message: 'Invalid credentials'
      }));
    });
  });
});
