import axios from 'axios';

// Create an axios instance with base URL for our API
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9876/api',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add timeout to prevent long-hanging requests
  timeout: 10000,
  // Enable credentials for cross-origin requests
  withCredentials: true
});

// Log the API base URL for debugging
console.log('API Base URL:', import.meta.env.VITE_API_URL || 'http://localhost:9876/api');

// Add a request interceptor to add the auth token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Adding token to request:', config.url);
    } else {
      console.warn('No token found for request:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle errors globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log detailed error information
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      params: error.config?.params,
      data: error.config?.data
    });

    // Handle 401 Unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request. Redirecting to login page.');
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if not already on login page to avoid redirect loops
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle database connection errors
    if (error.response && error.response.data &&
        (error.response.data.message?.includes('database') ||
         error.response.data.message?.includes('Database'))) {
      console.error('Database connection error:', error.response.data);
    }

    // Handle network errors
    if (!error.response && error.message === 'Network Error') {
      console.error('Network error - API server may be down or unreachable');
    }

    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData, userType) => API.post(`/auth/${userType}/register`, userData),
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// Tourist Services
export const touristService = {
  getDestinations: () => API.get('/destinations'),
  getDestination: (id) => API.get(`/destinations/${id}`),
  getAvailableVehicles: (date, time, passengers) =>
    API.get('/vehicles/available', { params: { date, time, passengers } }),
  createBooking: (bookingData) => API.post('/bookings', bookingData),
  getBookings: () => API.get('/tourist/bookings'),
  getBooking: (id) => API.get(`/bookings/${id}`),
  cancelBooking: (id, reason) => API.put(`/bookings/${id}/cancel`, { reason }),
};

// Driver Services
export const driverService = {
    registerVehicle: (vehicleData) => API.post('/driver/vehicles', vehicleData),
    getVehicles: () => API.get('/driver/vehicles'),
    updateVehicle: (id, vehicleData) => API.put(`/driver/vehicles/${id}`, vehicleData),
    getBookings: () => API.get('/driver/bookings'),
    getBooking: (id) => API.get(`/driver/bookings/${id}`),
    acceptBooking: (id) => API.put(`/driver/bookings/${id}/accept`),
    cancelBooking: (id, reason) => API.put(`/driver/bookings/${id}/cancel`, { reason }),
    updateVehicleStatus: (id, status) => API.put(`/driver/vehicles/${id}/status`, { status }),
    getEarnings: () => API.get('/driver/earnings'),
  };

  // Admin Services
  export const adminService = {
    // Dashboard and statistics
    getDashboardStats: () => API.get('/admin/dashboard'),

    // Driver management
    getDrivers: (filters) => API.get('/admin/drivers', { params: filters }),
    getDriver: (id) => API.get(`/admin/drivers/${id}`),
    updateDriverStatus: (id, status) => {
      console.log(`Sending driver status update: ID=${id}, Status=${status}`);

      // Create a more robust request with retry logic and fallback methods
      return new Promise((resolve, reject) => {
        // Try different HTTP methods if one fails
        const tryWithMethod = (method, retryCount = 0) => {
          console.log(`Attempting to update driver status with ${method} method (attempt ${retryCount + 1})`);

          let request;
          if (method === 'PATCH') {
            request = API.patch(`/admin/drivers/${id}/status`, { status });
          } else if (method === 'PUT') {
            request = API.put(`/admin/drivers/${id}/status`, { status });
          } else if (method === 'POST') {
            request = API.post(`/admin/drivers/${id}/status`, { status });
          }

          request
            .then(response => {
              console.log(`Driver status update successful with ${method}:`, response.data);
              resolve(response);
            })
            .catch(error => {
              console.error(`Error in updateDriverStatus with ${method} for driver ${id}:`, error);

              // If it's a network error and we haven't retried too many times
              if (error.message === 'Network Error' && retryCount < 2) {
                console.log(`Retrying ${method} due to network error (attempt ${retryCount + 1})`);
                // Wait a bit before retrying (exponential backoff)
                setTimeout(() => tryWithMethod(method, retryCount + 1), 1000 * (retryCount + 1));
              } else if (method === 'PATCH') {
                // If PATCH failed, try PUT
                console.log('PATCH method failed, trying PUT method...');
                tryWithMethod('PUT');
              } else if (method === 'PUT') {
                // If PUT failed, try POST
                console.log('PUT method failed, trying POST method...');
                tryWithMethod('POST');
              } else {
                // If all methods failed
                reject(error);
              }
            });
        };

        // Start with PATCH method
        tryWithMethod('PATCH');
      });
    },

    // Tourist management
    getTourists: (filters) => API.get('/admin/tourists', { params: filters }),
    getTourist: (id) => API.get(`/admin/tourists/${id}`),

    // Booking management
    getBookings: (filters) => API.get('/admin/bookings', { params: filters }),
    getBooking: (id) => API.get(`/admin/bookings/${id}`),

    // Destination management
    getDestinations: () => API.get('/destinations'),
    createDestination: (data) => API.post('/destinations', data),
    updateDestination: (id, data) => API.put(`/destinations/${id}`, data),
    deleteDestination: (id) => API.delete(`/destinations/${id}`),

    // Reports
    generateReport: (type, params) => API.get('/admin/reports', { params: { type, ...params } }),

    // Admin user management
    changePassword: (data) => API.put('/admin/change-password', data),
    createAdmin: (data) => API.post('/admin/create', data)
  };

  // Export the API instance directly for use in other services
  export default API;