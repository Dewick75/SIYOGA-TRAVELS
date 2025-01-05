// src/config/DB/update_database.js
const fs = require('fs');
const path = require('path');
const { executeQuery } = require('./db');
const logger = require('../logger');

async function updateDatabase() {
  try {
    logger.info('Starting database schema update...');

    // Read and execute the update_drivers_table.sql script
    const driversUpdateScript = fs.readFileSync(
      path.join(__dirname, 'update_drivers_table.sql'),
      'utf8'
    );
    
    // Split the script by GO statements
    const driversQueries = driversUpdateScript.split('GO');
    
    for (const query of driversQueries) {
      if (query.trim()) {
        try {
          await executeQuery(query);
          logger.info('Executed drivers table update query successfully');
        } catch (err) {
          logger.error(`Error executing drivers table update query: ${err.message}`);
        }
      }
    }

    // Read and execute the update_vehicles_table.sql script
    const vehiclesUpdateScript = fs.readFileSync(
      path.join(__dirname, 'update_vehicles_table.sql'),
      'utf8'
    );
    
    // Split the script by GO statements
    const vehiclesQueries = vehiclesUpdateScript.split('GO');
    
    for (const query of vehiclesQueries) {
      if (query.trim()) {
        try {
          await executeQuery(query);
          logger.info('Executed vehicles table update query successfully');
        } catch (err) {
          logger.error(`Error executing vehicles table update query: ${err.message}`);
        }
      }
    }

    logger.info('Database schema update completed successfully');
  } catch (error) {
    logger.error(`Error updating database schema: ${error.message}`);
  }
}

module.exports = updateDatabase;
