// Script to test the driver status update API endpoint
const http = require('http');

// Replace with an actual driver ID from your database
const driverId = 1; // Change this to a valid driver ID
const newStatus = 'Active';

// Mock token - you would need a valid token for actual testing
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJVc2VySUQiOjEsIlJvbGUiOiJBZG1pbiIsImlhdCI6MTYxNjc2MjQ5MCwiZXhwIjoxNjE2ODQ4ODkwfQ.7Tq_VeVHdAW86RxYGzDfUrzR_G1tGO3_bZczlRJLUXA';

const data = JSON.stringify({
  status: newStatus
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: `/api/admin/drivers/${driverId}/status`,
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': `Bearer ${token}`
  },
  timeout: 5000
};

console.log(`Testing driver status update API: PATCH ${options.path}`);
console.log(`Request data: ${data}`);

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('RESPONSE:', responseData);
    
    if (res.statusCode === 200) {
      console.log('✅ API endpoint is working!');
    } else {
      console.log('❌ API endpoint returned an error status code');
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Error making request to API endpoint');
  console.error(`Error details: ${e.message}`);
  
  if (e.code === 'ECONNREFUSED') {
    console.log('\nPossible solutions:');
    console.log('1. Make sure the backend server is started');
    console.log('2. Check if the server is running on a different port');
    console.log('3. Verify there are no firewall or network issues');
  }
});

req.on('timeout', () => {
  console.error('❌ Error: Request timed out');
  req.destroy();
});

req.write(data);
req.end();
