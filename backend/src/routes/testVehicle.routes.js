// src/routes/testVehicle.routes.js
const express = require('express');
const router = express.Router();
const testVehicleController = require('../controllers/testVehicleController');

// Public test routes - no authentication required
router.get('/available', testVehicleController.getAvailableVehicles);
router.get('/real', testVehicleController.getRealVehicles);
router.get('/:id', testVehicleController.getVehicleById);

module.exports = router;
