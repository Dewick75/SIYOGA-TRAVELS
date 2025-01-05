// src/routes/destination.routes.js
const express = require('express');
const router = express.Router();
const destinationController = require('../controllers/destinationController');
const { authenticate, authorize } = require('../middleware/auth');

// Public routes
router.get('/', destinationController.getAllDestinations);
router.get('/:id', destinationController.getDestinationById);

// Admin routes
router.use(authenticate);
router.post('/', authorize('Admin'), destinationController.createDestination);
router.put('/:id', authorize('Admin'), destinationController.updateDestination);
router.delete('/:id', authorize('Admin'), destinationController.deleteDestination);

module.exports = router;