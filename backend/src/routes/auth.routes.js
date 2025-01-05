// backend/src/routes/auth.routes.js
const express = require('express');
const router = express.Router(); // This creates a router instance
const authController = require('../controllers/authController');
const otpController = require('../controllers/otpController');
const { authenticate } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public routes
router.post('/register/tourist', upload.single('profilePicture'), authController.registerTourist);
router.post('/register/driver', upload.fields([
  // Support both camelCase and snake_case field names
  { name: 'profilePicture', maxCount: 1 },
  { name: 'profile_picture', maxCount: 1 },
  { name: 'nicFrontImage', maxCount: 1 },
  { name: 'nic_front_image', maxCount: 1 },
  { name: 'nicBackImage', maxCount: 1 },
  { name: 'nic_back_image', maxCount: 1 },
  { name: 'licenseFrontImage', maxCount: 1 },
  { name: 'license_front_image', maxCount: 1 },
  { name: 'policeClearanceImage', maxCount: 1 },
  { name: 'police_clearance_image', maxCount: 1 }
]), authController.registerDriver);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Email verification routes
router.get('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);

// OTP verification routes
router.post('/send-otp', otpController.sendOtp);
router.post('/verify-otp', otpController.verifyOtp);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);

module.exports = router; // Export the router, not the controller