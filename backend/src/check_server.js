// Simple script to check if the server is running
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 9876, // Changed to use port 9876
  path: '/health',
  method: 'GET',
  timeout: 5000
};

console.log('Checking if the backend server is running...');

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);

  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('RESPONSE:', data);
    console.log('✅ Backend server is running!');
  });
});

req.on('error', (e) => {
  console.error('❌ Error: Backend server is not running or not accessible');
  console.error(`Error details: ${e.message}`);

  if (e.code === 'ECONNREFUSED') {
    console.log('\nPossible solutions:');
    console.log('1. Make sure the backend server is started (run: npm start in the backend directory)');
    console.log('2. Check if the server is running on a different port (default is 5000)');
    console.log('3. Verify there are no firewall or network issues blocking the connection');
  }
});

req.on('timeout', () => {
  console.error('❌ Error: Request timed out');
  req.destroy();
});

req.end();
