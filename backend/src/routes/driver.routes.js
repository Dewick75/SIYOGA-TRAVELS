// src/routes/driver.routes.js
const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driverController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get driver profile
router.get('/profile', authorize('Driver'), driverController.getDriverProfile);

// Update driver profile
router.put('/profile', authorize('Driver'), driverController.updateDriverProfile);

// Change password
router.put('/change-password', authorize('Driver'), driverController.changeDriverPassword);

// Get driver trips
router.get('/trips', authorize('Driver'), driverController.getDriverTrips);

// Get driver reviews
router.get('/reviews', authorize('Driver'), driverController.getDriverReviews);

// Get driver earnings
router.get('/earnings', authorize('Driver'), driverController.getDriverEarnings);

// Get driver dashboard data
router.get('/dashboard', authorize('Driver'), driverController.getDriverDashboard);

// Update driver availability
router.put('/availability', authorize('Driver'), driverController.updateDriverAvailability);

module.exports = router;