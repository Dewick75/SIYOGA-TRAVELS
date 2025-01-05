// src/test-connection.js
const { executeQuery } = require('./config/DB/db');
const logger = require('./config/logger');

async function testConnection() {
  try {
    // Test simple query
    const result = await executeQuery('SELECT 1 AS TestResult');
    
    if (result && result.recordset && result.recordset[0].TestResult === 1) {
      logger.info('✅ Database connection successful!');
      
      // Test specific tables
      try {
        const tablesResult = await executeQuery(`
          SELECT TABLE_NAME 
          FROM INFORMATION_SCHEMA.TABLES 
          WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_CATALOG = DB_NAME()
        `);
        
        logger.info(`Found ${tablesResult.recordset.length} tables in database:`);
        tablesResult.recordset.forEach(table => {
          logger.info(`- ${table.TABLE_NAME}`);
        });
      } catch (tableError) {
        logger.error(`Could not list tables: ${tableError.message}`);
      }
    }
  } catch (error) {
    logger.error(`❌ Database connection failed: ${error.message}`);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

testConnection();