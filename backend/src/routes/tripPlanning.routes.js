// src/routes/tripPlanning.routes.js
const express = require('express');
const router = express.Router();
const tripPlanningController = require('../controllers/tripPlanningController');
const { authenticate } = require('../middleware/auth');

// Public routes for destinations
router.get('/destinations', tripPlanningController.getAllDestinations);
router.get('/destinations/:id', tripPlanningController.getDestinationById);
router.get('/distances', tripPlanningController.getDistance);

// Protected routes for trip planning
router.use(authenticate);
router.post('/trips', tripPlanningController.createTrip);
router.post('/trips/:tripId/stops', tripPlanningController.addTripStop);
router.post('/trips/:tripId/preferences', tripPlanningController.saveTripPreferences);

module.exports = router;
