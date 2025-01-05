// src/test-api.js
const http = require('http');
const https = require('https');
const logger = require('./config/logger');

// Configuration
const config = {
  baseUrl: 'http://localhost:5000', // Change to your API URL
  endpoints: [
    { path: '/health', method: 'GET', name: 'Health Check' },
    { path: '/api/destinations', method: 'GET', name: 'Get Destinations' }
  ]
};

async function testEndpoint(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${config.baseUrl}${endpoint.path}`;
    logger.info(`Testing: ${endpoint.method} ${url} (${endpoint.name})`);
    
    const client = url.startsWith('https') ? https : http;
    const req = client.request(url, { method: endpoint.method }, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const statusColor = res.statusCode < 400 ? '\x1b[32m' : '\x1b[31m'; // Green or Red
        logger.info(`${statusColor}${res.statusCode}\x1b[0m ${endpoint.method} ${endpoint.path}`);
        
        try {
          const jsonData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            body: jsonData,
            endpoint: endpoint
          });
        } catch (e) {
          logger.error(`Could not parse JSON response: ${e.message}`);
          resolve({
            statusCode: res.statusCode,
            body: data,
            endpoint: endpoint,
            error: 'Invalid JSON'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      logger.error(`Request error: ${error.message}`);
      reject(error);
    });
    
    req.end();
  });
}

async function runTests() {
  logger.info('🧪 Starting API tests...');
  
  try {
    const results = await Promise.allSettled(
      config.endpoints.map(endpoint => testEndpoint(endpoint))
    );
    
    // Report results
    const success = results.filter(r => r.status === 'fulfilled' && r.value.statusCode < 400).length;
    const failed = results.filter(r => r.status === 'fulfilled' && r.value.statusCode >= 400).length;
    const errors = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`\n📊 Test Summary: ${success} passed, ${failed} failed, ${errors} errors`);
    
    // Log failures in detail
    if (failed > 0 || errors > 0) {
      logger.info('\nFailed tests:');
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.statusCode >= 400) {
          const { endpoint, statusCode, body } = result.value;
          logger.info(`- ${endpoint.method} ${endpoint.path} (${endpoint.name}): ${statusCode}`);
          logger.info(`  Response: ${typeof body === 'object' ? JSON.stringify(body) : body}`);
        } else if (result.status === 'rejected') {
          logger.info(`- ${result.reason.message}`);
        }
      });
    }
  } catch (error) {
    logger.error(`Test runner error: ${error.message}`);
  }
}

// Run the tests
runTests();