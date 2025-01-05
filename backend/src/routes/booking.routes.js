// src/routes/booking.routes.js
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, authorize } = require('../middleware/auth');

// Public route for trip planning (no authentication required)
router.post('/plan', bookingController.planTrip);

// All other routes require authentication
router.use(authenticate);

// Admin routes
router.get('/', authorize('Admin'), bookingController.getAllBookings);
router.get('/statistics', authorize('Admin'), bookingController.getBookingStatistics);

// Common routes
router.get('/:id', bookingController.getBookingById);

// Tourist routes
router.post('/', authorize('Tourist'), bookingController.createBooking);
router.get('/tourist/bookings', authorize('Tourist'), bookingController.getTouristBookings);
router.post('/:id/cancel', authorize('Tourist'), bookingController.cancelBooking);

// Driver routes
router.get('/driver/bookings', authorize('Driver'), bookingController.getDriverBookings);
router.patch('/:id/status', authorize(['Driver', 'Admin']), bookingController.updateBookingStatus);

module.exports = router;