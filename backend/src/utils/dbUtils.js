// src/utils/dbUtils.js
const { 
  executeQuery, 
  executeStoredProcedure, 
  beginTransaction, 
  commitTransaction, 
  rollbackTransaction 
} = require('../config/DB/db');

// Re-export the database utility functions
module.exports = {
  executeQuery,
  executeStoredProcedure,
  beginTransaction,
  commitTransaction,
  rollbackTransaction
};
