// Test script for admin login
import axios from 'axios';

const API_URL = 'http://localhost:9876/api';

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');
    
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin_test@siyoga.com',
      password: 'Admin@123456'
    });
    
    console.log('Login response:', response.data);
    
    if (response.data.success) {
      console.log('Admin login successful!');
      console.log('Token:', response.data.token);
      
      // Test getting dashboard stats with the token
      const dashboardResponse = await axios.get(`${API_URL}/admin/dashboard`, {
        headers: {
          Authorization: `Bearer ${response.data.token}`
        }
      });
      
      console.log('Dashboard response:', dashboardResponse.data);
    } else {
      console.error('Admin login failed:', response.data.message);
    }
  } catch (error) {
    console.error('Error testing admin login:', error.response ? error.response.data : error.message);
  }
}

// Run the test
testAdminLogin();
