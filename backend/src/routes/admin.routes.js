// src/routes/admin.routes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// Special route for creating an admin - no auth required
// This allows creating the first admin in the system
router.post('/create', adminController.createAdmin);

// All other routes require authentication and admin authorization
router.use(authenticate);
// Apply the authorize middleware to all routes
router.use((req, res, next) => {
  authorize('admin')(req, res, next);
});

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// Drivers management
router.get('/drivers', adminController.getAllDrivers);
router.get('/drivers/:id', adminController.getDriverById);
router.patch('/drivers/:id/status', adminController.updateDriverStatus);

// Alternative endpoint for driver status update (for fallback)
router.post('/drivers/:id/status', adminController.updateDriverStatus);
router.put('/drivers/:id/status', adminController.updateDriverStatus);

// Tourists management
router.get('/tourists', adminController.getAllTourists);
router.get('/tourists/:id', adminController.getTouristById);

// Reports
router.get('/reports', adminController.generateReport);

// Admin user management
router.put('/change-password', adminController.changeAdminPassword);

module.exports = router;