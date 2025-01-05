// src/routes/payment.routes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Tourist routes
router.post('/process', authorize('Tourist'), paymentController.processBookingPayment);
router.get('/methods', authorize('Tourist'), paymentController.getSavedPaymentMethods);
router.delete('/methods/:id', authorize('Tourist'), paymentController.deleteSavedPaymentMethod);
router.put('/methods/:id/default', authorize('Tourist'), paymentController.setDefaultPaymentMethod);

// Common routes
router.get('/booking/:bookingId', paymentController.getPaymentByBooking);

// Admin routes
router.get('/', authorize('Admin'), paymentController.getAllPayments);
router.get('/statistics', authorize('Admin'), paymentController.getPaymentStatistics);

module.exports = router;