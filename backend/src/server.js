// src/server.js
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const { connectDB, createDatabaseIfNotExists } = require('./config/DB/db');

// Start server function
const startServer = async () => {
  // Start the server even if database connection fails
  const PORT = process.env.PORT || config.port || 9876; // Changed to use port 9876
  const server = app.listen(PORT, () => {
    logger.info(`✅ Server is running on port ${PORT}`);
    logger.info(`🚀 API is available at http://localhost:${PORT}/api`);
  });

  // Try to create the database and connect to it
  try {
    // First try to create the database if it doesn't exist
    logger.info('Checking if database exists and creating it if needed...');
    const dbResult = await createDatabaseIfNotExists();

    // Check if the result is a string (error message) or success message
    if (typeof dbResult === 'string' && dbResult.startsWith('Failed to create database')) {
      logger.warn(`Database creation warning: ${dbResult}`);
      // Continue execution even if database creation had issues
    } else {
      logger.info(`Database check result: ${dbResult}`);
    }

    // Then connect to the database with retry mechanism
    await connectDB(3); // Try 3 times
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error(`❌ Database connection failed: ${error.message} ${error.stack || ''}`);
    logger.warn('Server will continue running, but database operations will fail until connection is restored');

    // Provide troubleshooting information
    logger.info('');
    logger.info('=== SQL Server Connection Troubleshooting ===');
    logger.info('1. Make sure SQL Server is installed and running');
    logger.info('2. Verify the server name in db.js (currently: "DESKTOP-133\\SQLEXPRESS")');
    logger.info('3. Confirm the database "TripBookingSystem" exists in SQL Server');
    logger.info('4. Check that Windows Authentication is enabled for SQL Server');
    logger.info('5. Ensure the mssql package is properly installed');
    logger.info('6. Try creating the database manually using SQL Server Management Studio');
    logger.info('');

    // Set up a periodic reconnection attempt
    setInterval(async () => {
      try {
        logger.info('Attempting to reconnect to database...');
        await connectDB(1); // Try once
        logger.info('✅ Database reconnected successfully');
      } catch (reconnectError) {
        logger.error(`❌ Database reconnection failed: ${reconnectError.message}`);
      }
    }, 60000); // Try every minute
  }

  // Handle graceful shutdown
  const gracefulShutdown = () => {
    logger.info('Received shutdown signal, closing server and database connections...');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });

    // Force close after 10 seconds
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  // Listen for termination signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`❌ Unhandled Rejection: ${err.message}`);
  console.error(err);
  // Close server & exit process
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`❌ Uncaught Exception: ${err.message}`);
  console.error(err);
  // Close server & exit process
  process.exit(1);
});

// Start the server
startServer();