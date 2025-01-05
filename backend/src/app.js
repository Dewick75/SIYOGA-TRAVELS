// src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const logger = require('./config/logger');
const config = require('./config/config');
const updateDatabase = require('./config/DB/update_database');

// Import middleware
const { errorHandler } = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/auth.routes');
const touristRoutes = require('./routes/tourist.routes');
const driverRoutes = require('./routes/driver.routes');
const vehicleRoutes = require('./routes/vehicle.routes');
const destinationRoutes = require('./routes/destination.routes');
const bookingRoutes = require('./routes/booking.routes');
const paymentRoutes = require('./routes/payment.routes');
const adminRoutes = require('./routes/admin.routes');
const uploadRoutes = require('./routes/upload.routes');
const testVehicleRoutes = require('./routes/testVehicle.routes');
const tripPlanningRoutes = require('./routes/tripPlanning.routes');

// Initialize app
const app = express();

// Update database schema
updateDatabase().catch(err => {
  logger.error(`Failed to update database schema: ${err.message}`);
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Configure CORS to allow requests from the React frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Log CORS configuration
logger.info('CORS configured with origins: http://localhost:5173, http://localhost:5174, http://127.0.0.1:5173, http://127.0.0.1:5174, http://localhost:3000');
logger.info('CORS methods allowed: GET, POST, PUT, DELETE, PATCH, OPTIONS');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev', { stream: { write: message => logger.info(message.trim()) } }));

// Serve static files from uploads directory
const uploadsPath = path.join(__dirname, '../', config.upload.destination);
app.use('/uploads', express.static(uploadsPath, {
  // Set Cache-Control header to no-cache for profile pictures
  setHeaders: (res, path) => {
    if (path.includes('profile-pictures')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }

}));
logger.info(`Serving static files from: ${uploadsPath}`);

// Log the full path for debugging
logger.info(`Full absolute path to uploads: ${path.resolve(uploadsPath)}`);

// Serve static files from public directory for test pages
const publicPath = path.join(__dirname, 'public');
app.use('/test', express.static(publicPath));
logger.info(`Serving static files from public directory: ${publicPath}`);

// Add a test route to check if static file serving is working
app.get('/test-static', (req, res) => {
  res.send(`
    <h1>Static File Test</h1>
    <p>Uploads directory: ${uploadsPath}</p>
    <p>Full path: ${path.resolve(uploadsPath)}</p>
  `);
});

// Add a route to test profile images
app.get('/test-images', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'test-images.html'));
});

// Add a route for direct image testing
app.get('/direct-image-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'direct-image-test.html'));
});

// Add a route for manual testing
app.get('/manual-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manual-test.html'));
});

// Add a route for login testing
app.get('/login-test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login-test.html'));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tourists', touristRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/destinations', destinationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/trip-planning', tripPlanningRoutes);

// Test routes
app.use('/api/test/vehicles', testVehicleRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});


module.exports = app;