// src/routes/vehicle.routes.js
const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { authenticate, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

// Public routes
router.get('/', vehicleController.getAllVehicles);
router.get('/available', vehicleController.getAllVehicles); // For getting available vehicles
router.get('/:id', vehicleController.getVehicleById);
router.get('/:id/availability', vehicleController.checkAvailability);

// Protected routes
router.use(authenticate);

// Driver routes
router.post('/', authorize('Driver'), upload.single('vehicleImage'), vehicleController.registerVehicle);
router.put('/:id', authorize('Driver'), upload.single('vehicleImage'), vehicleController.updateVehicle);
router.delete('/:id', authorize('Driver'), vehicleController.deleteVehicle);
router.get('/driver/vehicles', authorize('Driver'), vehicleController.getDriverVehicles);

module.exports = router;