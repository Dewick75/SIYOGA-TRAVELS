// src/config/DB/db.js - SQL Server connection configuration
// This file handles database connections for the TripBookingSystem database
const sql = require("mssql/msnodesqlv8");
const logger = require('../logger');

// DSN connection configuration
const config = {
  driver: "msnodesqlv8",
  connectionString: "DSN=TripBookingSystem;Trusted_Connection=Yes;"
};

// Note: Make sure the DSN is configured in ODBC Data Sources to point to TripBookingSystem database
// Create a pool that we can use for all database operations
const pool = new sql.ConnectionPool(config);
const poolConnect = pool.connect();

// Initial connection to the database
poolConnect
  .then(() => {
    logger.info('Connected to SQL Server successfully');
  })
  .catch(err => {
    logger.error('Database connection failed:', err);
    // Don't exit the process, allow the application to handle the error
    // process.exit(1);
  });

// Function to execute a query with parameters
const executeQuery = async (query, params = {}) => {
  try {
    // First, ensure the pool is connected or reconnect if needed
    try {
      await poolConnect; // Wait for initial connection promise

      // Check if pool is connected
      if (!pool.connected) {
        logger.warn('Pool not connected, attempting to reconnect...');
        try {
          // Close the existing pool if it exists
          if (pool) {
            try {
              await pool.close();
              logger.info('Closed existing pool connection');
            } catch (closeError) {
              logger.warn('Error closing existing pool:', closeError.message);
              // Continue anyway
            }
          }

          // Create a new pool and connect
          const newPool = new sql.ConnectionPool(config);
          await newPool.connect();

          // Replace the old pool with the new one
          Object.assign(pool, newPool);
          logger.info('Successfully reconnected to the database with a new connection pool');
        } catch (reconnectError) {
          logger.error('Failed to reconnect to the database:', reconnectError);
          throw new Error(`Database connection failed: ${reconnectError.message}`);
        }
      }
    } catch (connectionError) {
      logger.error('Initial connection error:', connectionError);

      // Try to create a new connection pool
      try {
        logger.info('Attempting to create a new connection pool...');
        const newPool = new sql.ConnectionPool(config);
        await newPool.connect();

        // Replace the old pool with the new one
        Object.assign(pool, newPool);
        logger.info('Successfully created a new connection pool');
      } catch (newPoolError) {
        logger.error('Failed to create a new connection pool:', newPoolError);
        throw new Error(`Database connection failed: ${newPoolError.message}`);
      }
    }

    // Now create a request and execute the query
    const request = pool.request();

    // Add parameters to the request
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        request.input(key, value);
      } else {
        logger.warn(`Parameter ${key} is null or undefined, setting to empty string`);
        request.input(key, '');
      }
    });

    logger.debug(`Executing query: ${query.substring(0, 100)}...`);

    try {
      const result = await request.query(query);
      logger.debug(`Query executed successfully with ${result.recordset ? result.recordset.length : 0} records`);
      return result;
    } catch (queryError) {
      logger.error(`SQL query execution error: ${queryError.message}`);

      // Check for specific SQL Server errors
      if (queryError.number) {
        logger.error(`SQL Server Error Number: ${queryError.number}`);

        // Handle specific SQL Server error codes
        if (queryError.number === 4060) {
          throw new Error('Cannot open database requested in the login. Please verify the database name and try again.');
        } else if (queryError.number === 18456) {
          throw new Error('Login failed for the specified user. Please check authentication credentials.');
        } else if (queryError.number === 2714) {
          throw new Error('There is already an object with that name in the database.');
        }
      }

      throw queryError;
    }
  } catch (error) {
    logger.error('Database query error:', error);
    logger.error(`Query that failed: ${query.substring(0, 200)}...`);
    logger.error(`Parameters: ${JSON.stringify(params)}`);

    // Provide more detailed error information
    const enhancedError = new Error(`Database query failed: ${error.message}`);
    enhancedError.originalError = error;
    enhancedError.query = query;
    enhancedError.params = params;
    throw enhancedError;
  }
};

// Function to execute a stored procedure with parameters
const executeStoredProcedure = async (procedureName, params = {}) => {
  try {
    await poolConnect; // Ensures pool is connected
    const request = pool.request();

    // Add parameters to the request
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });

    const result = await request.execute(procedureName);
    return result;
  } catch (error) {
    logger.error(`Error executing stored procedure ${procedureName}:`, error);
    throw error;
  }
};

// Function to begin a transaction
const beginTransaction = async () => {
  await poolConnect;
  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  return transaction;
};

// Function to commit a transaction
const commitTransaction = async (transaction) => {
  await transaction.commit();
};

// Function to rollback a transaction
const rollbackTransaction = async (transaction) => {
  await transaction.rollback();
};

// Function to connect to the database with retry mechanism
const connectDB = async (retries = 1) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      logger.info(`Database connection attempt ${attempt}/${retries}`);
      await poolConnect;
      return pool;
    } catch (error) {
      lastError = error;
      logger.error(`Database connection attempt ${attempt} failed:`, error);

      if (attempt < retries) {
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        logger.info(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we get here, all retries failed
  throw lastError || new Error('Failed to connect to database after multiple attempts');
};

// Function to create the database if it doesn't exist
const createDatabaseIfNotExists = async () => {
  try {
    // Use a separate connection to master database to check if our database exists
    const masterConfig = {
      driver: "msnodesqlv8",
      server: "DESKTOP-133\\SQLEXPRESS", // Using server name directly for master connection
      database: "master",
      options: {
        trustedConnection: true
      }
    };

    // Create a new connection to master
    const masterPool = new sql.ConnectionPool(masterConfig);
    await masterPool.connect();

    // Check if database exists
    const dbName = "TripBookingSystem";
    const checkDbQuery = `
      IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = '${dbName}')
      BEGIN
        CREATE DATABASE ${dbName};
        SELECT 'Database created' AS result;
      END
      ELSE
      BEGIN
        SELECT 'Database already exists' AS result;
      END
    `;

    const result = await masterPool.request().query(checkDbQuery);
    logger.info(`Database check result: ${result.recordset[0].result}`);

    // Close the master connection
    await masterPool.close();

    return result.recordset[0].result;
  } catch (error) {
    logger.error(`Error creating database: ${error.message}`);
    // Instead of throwing the error, return a message
    return `Failed to create database: ${error.message}`;
  }
};

module.exports = {
  sql,
  pool,
  executeQuery,
  executeStoredProcedure,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
  connectDB,
  createDatabaseIfNotExists
};