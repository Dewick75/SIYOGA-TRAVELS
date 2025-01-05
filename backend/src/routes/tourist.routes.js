// src/routes/tourist.routes.js
const express = require('express');
const router = express.Router();
const touristController = require('../controllers/touristController');
const touristRegistrationController = require('../controllers/touristRegistrationController');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { executeQuery } = require('../config/DB/db');
const logger = require('../config/logger');

// Public registration route (no authentication required)
router.post('/register', upload.single('profilePicture'), touristRegistrationController.registerTourist);

// All other routes require authentication except test routes
router.use((req, res, next) => {
  if (req.path.includes('/test-')) {
    return next();
  }
  authenticate(req, res, next);
});

// Get tourist profile
router.get('/profile', authorize('Tourist'), touristController.getTouristProfile);

// Update tourist profile
router.put('/profile', authorize('Tourist'), upload.single('profilePicture'), touristController.updateTouristProfile);

// Test route to get profile picture info - no authentication required for testing
router.get('/test-profile-picture', async (req, res) => {
  try {
    // Get all tourists with profile pictures
    const result = await executeQuery(`
      SELECT
        TouristID,
        Name,
        ProfilePicture
      FROM Tourists
      WHERE ProfilePicture IS NOT NULL AND ProfilePicture <> ''
    `);

    if (!result.recordset || result.recordset.length === 0) {
      return res.json({
        success: false,
        message: 'No tourists with profile pictures found'
      });
    }

    // Return the data
    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    logger.error(`Error in test-profile-picture route: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Change password
router.put('/change-password', authorize('Tourist'), touristController.changeTouristPassword);

// Get tourist trips
router.get('/trips', authorize('Tourist'), touristController.getTouristTrips);

// Submit review
router.post('/reviews', authorize('Tourist'), touristController.submitReview);

// Get tourist reviews
router.get('/reviews', authorize('Tourist'), touristController.getTouristReviews);

// Get tourist dashboard data
router.get('/dashboard', authorize('Tourist'), touristController.getTouristDashboard);

module.exports = router;