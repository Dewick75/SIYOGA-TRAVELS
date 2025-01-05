// // test-connection.js
// // Run this file to test your SQL Server connection and configuration

// const { pool, executeQuery } = require('./src/config/DB/db');
// const config = require('./src/config/config');
// const logger = require('./src/config/logger');

// // Test configuration
// logger.info('Testing configuration:');
// logger.info(`Server port: ${config.port}`);
// logger.info(`Environment: ${config.nodeEnv}`);
// logger.info(`JWT configured: ${config.jwt.secret ? 'Yes' : 'No'}`);
// logger.info(`CORS origins: ${config.corsOrigins.join(', ')}`);
// logger.info('-'.repeat(40));

// // Test database connection
// async function testConnection() {
//   try {
//     logger.info('Testing database connection...');
    
//     // Test a simple query
//     const result = await executeQuery('SELECT @@VERSION AS Version');
//     logger.info('SQL Server connected successfully!');
//     logger.info(`SQL Server version: ${result.recordset[0].Version}`);
    
//     // Test if destinations table exists
//     try {
//       const destResult = await executeQuery('SELECT TOP 1 * FROM Destinations');
//       logger.info('Destinations table exists and contains:');
//       if (destResult.recordset && destResult.recordset.length > 0) {
//         const destination = destResult.recordset[0];
//         logger.info(`- ${destination.Name} (${destination.Location})`);
//       } else {
//         logger.info('Destinations table is empty');
//       }
//     } catch (err) {
//       logger.error('Error querying Destinations table:', err);
//       logger.info('Make sure to create the database tables using the schema.sql script');
//     }
    
//     // Close the connection pool
//     logger.info('Closing connection...');
//     await pool.close();
//     logger.info('Connection closed');
    
//   } catch (err) {
//     logger.error('Database connection test failed:', err);
//     process.exit(1);
//   }
// }

// // Run the test
// testConnection();



//________________________________ 5.12 codes

