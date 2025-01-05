// src/services/touristService.js
import axios from 'axios';

const API_URL = 'http://localhost:9876/api/tourists';
const AUTH_API_URL = 'http://localhost:9876/api/auth';

/**
 * Send OTP to email for verification
 * @param {string} email - Email to send OTP to
 * @returns {Promise} - Promise with OTP send response
 */
export const sendOtp = async (email) => {
  try {
    console.log('Sending OTP request to:', `${AUTH_API_URL}/send-otp`);

    const response = await axios.post(`${AUTH_API_URL}/send-otp`, { email });

    console.log('OTP send response:', response.data);

    if (response.data && response.data.success) {
      return response.data;
    } else {
      console.error('Unexpected OTP send response format:', response.data);
      throw new Error('Unexpected response format from server');
    }
  } catch (error) {
    console.error('OTP send error details:', error);

    if (error.response) {
      console.error('Server error response:', error.response.data);
      const errorMessage = error.response.data.message || 'Failed to send OTP';
      throw new Error(errorMessage);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response from server. Please check your internet connection and try again.');
    } else {
      console.error('Request setup error:', error.message);
      throw new Error('Error setting up request: ' + error.message);
    }
  }
};

/**
 * Verify OTP
 * @param {string} email - Email associated with OTP
 * @param {string} otp - OTP to verify
 * @returns {Promise} - Promise with OTP verification response
 */
export const verifyOtp = async (email, otp) => {
  try {
    console.log('Sending OTP verification request to:', `${AUTH_API_URL}/verify-otp`);

    const response = await axios.post(`${AUTH_API_URL}/verify-otp`, { email, otp });

    console.log('OTP verification response:', response.data);

    if (response.data && response.data.success) {
      return response.data;
    } else {
      console.error('Unexpected OTP verification response format:', response.data);
      throw new Error('Unexpected response format from server');
    }
  } catch (error) {
    console.error('OTP verification error details:', error);

    if (error.response) {
      console.error('Server error response:', error.response.data);
      const errorMessage = error.response.data.message || 'Failed to verify OTP';
      throw new Error(errorMessage);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response from server. Please check your internet connection and try again.');
    } else {
      console.error('Request setup error:', error.message);
      throw new Error('Error setting up request: ' + error.message);
    }
  }
};

/**
 * Register a new tourist
 * @param {FormData} formData - FormData object containing tourist registration data
 * @returns {Promise} - Promise with registration response
 */
export const registerTourist = async (formData) => {
  try {
    console.log('Sending registration request to:', `${API_URL}/register`);

    // Validate that formData is a FormData object
    if (!(formData instanceof FormData)) {
      console.error('Invalid formData type:', typeof formData);
      throw new Error('Invalid form data format');
    }

    // Log all form data entries for debugging
    console.log('Form data entries:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + (pair[0] === 'password' ? '[REDACTED]' : pair[1]));
    }

    // Check for required fields
    const requiredFields = ['name', 'email', 'password', 'phoneNumber', 'country'];
    for (const field of requiredFields) {
      if (!formData.get(field)) {
        console.error(`Required field missing: ${field}`);
        throw new Error(`Required field missing: ${field}`);
      }
    }

    const response = await axios.post(`${API_URL}/register`, formData, {
      headers: {
        // Don't set Content-Type header for FormData, browser will set it automatically
      },
    });

    console.log('Registration response:', response.data);

    // Handle different response formats
    // If the response has a success property, use it
    if (response.data && typeof response.data.success !== 'undefined') {
      return response.data;
    }
    // If the response has a status code in the 2xx range, consider it successful
    else if (response.status >= 200 && response.status < 300) {
      return {
        success: true,
        message: 'Registration successful',
        data: response.data
      };
    }
    // Otherwise, consider it an error
    else {
      console.error('Unexpected response format:', response.data);
      throw new Error('Unexpected response format from server');
    }
  } catch (error) {
    console.error('Registration error details:', error);

    // Create a default error message
    let errorMessage = 'Registration failed. Please try again.';

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Server error response:', error.response.data);

      // Try to extract error message from response
      if (error.response.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }

      // Check for specific error types to provide better error messages
      if (errorMessage.includes('email')) {
        if (errorMessage.includes('already registered')) {
          errorMessage = 'This email is already registered. Please use a different email or try to log in.';
        } else if (errorMessage.includes('invalid') || errorMessage.includes('format')) {
          errorMessage = 'Please enter a valid email address.';
        }
      } else if (errorMessage.includes('password')) {
        errorMessage = 'Password issue: ' + errorMessage;
      } else if (errorMessage.includes('phone')) {
        errorMessage = 'Phone number issue: ' + errorMessage;
      } else if (errorMessage.includes('date')) {
        errorMessage = 'Date of birth issue: ' + errorMessage;
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      errorMessage = 'No response from server. Please check your internet connection and try again.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      errorMessage = 'Error setting up request: ' + error.message;
    }

    // Throw the error with the appropriate message
    throw new Error(errorMessage);
  }
};

/**
 * Get tourist profile
 * @param {string} token - JWT token
 * @returns {Promise} - Promise with tourist profile data
 */
export const getTouristProfile = async (token) => {
  try {
    const response = await axios.get(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.message || 'Failed to get profile');
    } else if (error.request) {
      throw new Error('No response from server. Please try again later.');
    } else {
      throw new Error('Error setting up request: ' + error.message);
    }
  }
};

export default {
  registerTourist,
  getTouristProfile,
  sendOtp,
  verifyOtp
};
