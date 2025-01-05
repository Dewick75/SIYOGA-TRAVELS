// Test database connection
const sql = require("mssql/msnodesqlv8");
const logger = require('./config/logger');

// DSN connection configuration
const config = {
  driver: "msnodesqlv8",
  connectionString: "DSN=TripBookingSystem;Trusted_Connection=Yes;"
};

// Alternative direct connection configuration
const directConfig = {
  driver: "msnodesqlv8",
  server: "DESKTOP-133\\SQLEXPRESS",
  database: "TripBookingSystem",
  options: {
    trustedConnection: true
  }
};

// Test DSN connection
async function testDsnConnection() {
  console.log("Testing DSN connection...");
  try {
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    console.log("DSN Connection successful!");
    
    // Test query
    const result = await pool.request().query('SELECT COUNT(*) AS UserCount FROM Users');
    console.log(`User count: ${result.recordset[0].UserCount}`);
    
    await pool.close();
    return true;
  } catch (error) {
    console.error("DSN Connection failed:", error);
    return false;
  }
}

// Test direct connection
async function testDirectConnection() {
  console.log("\nTesting direct connection...");
  try {
    const pool = new sql.ConnectionPool(directConfig);
    await pool.connect();
    console.log("Direct connection successful!");
    
    // Test query
    const result = await pool.request().query('SELECT COUNT(*) AS UserCount FROM Users');
    console.log(`User count: ${result.recordset[0].UserCount}`);
    
    await pool.close();
    return true;
  } catch (error) {
    console.error("Direct connection failed:", error);
    return false;
  }
}

// Run tests
async function runTests() {
  const dsnResult = await testDsnConnection();
  const directResult = await testDirectConnection();
  
  console.log("\n=== Test Results ===");
  console.log(`DSN Connection: ${dsnResult ? 'SUCCESS' : 'FAILED'}`);
  console.log(`Direct Connection: ${directResult ? 'SUCCESS' : 'FAILED'}`);
  
  if (!dsnResult && directResult) {
    console.log("\nRecommendation: Use direct connection instead of DSN.");
  } else if (!dsnResult && !directResult) {
    console.log("\nBoth connection methods failed. Please check SQL Server configuration.");
  }
}

runTests().catch(err => {
  console.error("Test failed:", err);
});
