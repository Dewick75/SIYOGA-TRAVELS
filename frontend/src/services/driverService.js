// src/services/driverService.js
import axios from 'axios';

const API_URL = 'http://localhost:9876/api/drivers';
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

      // Check if the error is related to email already registered
      if (error.response.data.message && error.response.data.message.includes('already registered')) {
        throw new Error('Email already registered. Please use a different email or try to log in.');
      }

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
 * Register a new driver
 * @param {FormData} formData - FormData object containing driver registration data
 * @returns {Promise} - Promise with registration response
 */
export const registerDriver = async (formData) => {
  try {
    console.log('Sending registration request to:', `${AUTH_API_URL}/register/driver`);

    // Validate that formData is a FormData object
    if (!(formData instanceof FormData)) {
      console.error('Invalid formData type:', typeof formData);
      throw new Error('Invalid form data format');
    }

    // Log all form data entries for debugging (except password)
    console.log('Form data entries:');
    for (let pair of formData.entries()) {
      if (pair[0] === 'password') {
        console.log(pair[0] + ': [REDACTED]');
      } else if (pair[1] instanceof Blob) {
        console.log(`${pair[0]}: [Blob ${pair[1].size} bytes, type: ${pair[1].type}]`);
      } else {
        console.log(`${pair[0]}: ${pair[1]}`);
      }
    }

    // Check for required fields - using both camelCase and snake_case versions
    const requiredFields = [
      { camelCase: 'name', snakeCase: 'name' },
      { camelCase: 'email', snakeCase: 'email' },
      { camelCase: 'password', snakeCase: 'password' },
      { camelCase: 'phoneNumber', snakeCase: 'phone_number' },
      { camelCase: 'licenseNumber', snakeCase: 'license_number' },
      { camelCase: 'nicNumber', snakeCase: 'nic_number' }
    ];
    const missingFields = [];

    for (const field of requiredFields) {
      // Check if either camelCase or snake_case version exists
      if (!formData.get(field.camelCase) && !formData.get(field.snakeCase)) {
        missingFields.push(field.camelCase);
      }
    }

    if (missingFields.length > 0) {
      console.error(`Required fields missing: ${missingFields.join(', ')}`);
      throw new Error(`Required fields missing: ${missingFields.join(', ')}`);
    }

    // Check for required image files - using both camelCase and snake_case versions
    const requiredImages = [
      { camelCase: 'nicFrontImage', snakeCase: 'nic_front_image' },
      { camelCase: 'nicBackImage', snakeCase: 'nic_back_image' },
      { camelCase: 'licenseFrontImage', snakeCase: 'license_front_image' }
    ];
    const missingImages = [];

    for (const field of requiredImages) {
      // Check if either camelCase or snake_case version exists
      const camelCaseFile = formData.get(field.camelCase);
      const snakeCaseFile = formData.get(field.snakeCase);

      const camelCaseValid = camelCaseFile && (camelCaseFile instanceof Blob) && camelCaseFile.size > 0;
      const snakeCaseValid = snakeCaseFile && (snakeCaseFile instanceof Blob) && snakeCaseFile.size > 0;

      if (!camelCaseValid && !snakeCaseValid) {
        missingImages.push(field.camelCase);
      }
    }

    if (missingImages.length > 0) {
      console.error(`Required images missing: ${missingImages.join(', ')}`);
      throw new Error(`Required images missing: ${missingImages.join(', ')}`);
    }

    // Make the API request with improved error handling
    try {
      // Log the URL we're posting to
      console.log(`Posting to URL: ${AUTH_API_URL}/register/driver`);

      // Do NOT set Content-Type header for FormData - let the browser set it with the boundary
      const response = await axios.post(`${AUTH_API_URL}/register/driver`, formData, {
        headers: {
          // The browser will automatically set the correct Content-Type with boundary
        },
        // Add timeout and ensure transformRequest is not interfering with FormData
        timeout: 60000, // 60 seconds timeout (increased from 30 seconds)
        transformRequest: (data) => {
          // Return the FormData object directly without transformation
          return data;
        },
        // Add additional options to help with debugging
        maxContentLength: 100 * 1024 * 1024, // 100MB max content length
        maxBodyLength: 100 * 1024 * 1024,    // 100MB max body length
        validateStatus: (status) => {
          // Log all status codes for debugging
          console.log(`Response status: ${status}`);
          return status >= 200 && status < 300; // default
        }
      });

      console.log('Registration response:', response.data);

      if (response.data && response.data.success) {
        return response.data;
      } else {
        console.error('Unexpected registration response format:', response.data);
        throw new Error('Unexpected response format from server');
      }
    } catch (axiosError) {
      // Handle Axios errors specifically
      if (axiosError.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Server error response:', axiosError.response.data);
        console.error('Status code:', axiosError.response.status);
        console.error('Headers:', axiosError.response.headers);

        // Check if the error is related to email already registered
        if (axiosError.response.data.message && axiosError.response.data.message.includes('already registered')) {
          throw new Error('Email already registered. Please use a different email or try to log in.');
        }

        // Check if the error is related to invalid data format but might have succeeded
        if (axiosError.response.data.message && axiosError.response.data.message.includes('Invalid data format')) {
          // Make a check to see if the user was actually created
          try {
            // Wait a moment to allow the database to complete any pending operations
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check if the email verification was sent (indirect way to check if registration succeeded)
            const verifyResponse = await verifyOtp(formData.get('email'), '000000');

            // If we get a specific error about invalid OTP, it means the user exists
            if (verifyResponse.message && verifyResponse.message.includes('Invalid OTP')) {
              console.log('User appears to exist despite error. Registration might have succeeded.');
              return {
                success: true,
                message: 'Registration appears to have succeeded. Please check your email for verification.',
                data: {
                  email: formData.get('email'),
                  verified: false
                }
              };
            }
          } catch (checkError) {
            console.error('Error checking if registration succeeded:', checkError);
            // Continue with the original error
          }
        }

        const errorMessage = axiosError.response.data.message || 'Failed to register driver';
        throw new Error(errorMessage);
      } else if (axiosError.request) {
        // The request was made but no response was received
        console.error('No response received:', axiosError.request);
        throw new Error('No response from server. Please check your internet connection and try again.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request setup error:', axiosError.message);
        throw new Error('Error setting up request: ' + axiosError.message);
      }
    }
  } catch (error) {
    console.error('Driver registration error details:', error);
    throw error; // Re-throw the error to be handled by the calling component
  }
};

/**
 * Get driver profile
 * @param {string} token - JWT token
 * @returns {Promise} - Promise with driver profile data
 */
export const getDriverProfile = async (token) => {
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
  registerDriver,
  getDriverProfile,
  sendOtp,
  verifyOtp
};
