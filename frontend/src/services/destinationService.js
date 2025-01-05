import API from './api';

/**
 * Service for handling destination-related API calls
 */
const destinationService = {
  /**
   * Get all destinations
   * @returns {Promise} Promise object with destination data
   */
  getAllDestinations: async () => {
    try {
      const response = await API.get('/destinations');
      return response.data;
    } catch (error) {
      console.error('Error fetching destinations:', error);
      throw error;
    }
  },

  /**
   * Get a destination by ID
   * @param {number} id - The destination ID
   * @returns {Promise} Promise object with destination data
   */
  getDestinationById: async (id) => {
    try {
      const response = await API.get(`/destinations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching destination ${id}:`, error);
      throw error;
    }
  },

  /**
   * Create a new destination
   * @param {Object} destinationData - The destination data
   * @returns {Promise} Promise object with the created destination
   */
  createDestination: async (destinationData) => {
    try {
      const response = await API.post('/destinations', destinationData);
      return response.data;
    } catch (error) {
      console.error('Error creating destination:', error);
      throw error;
    }
  },

  /**
   * Update an existing destination
   * @param {number} id - The destination ID
   * @param {Object} destinationData - The updated destination data
   * @returns {Promise} Promise object with the updated destination
   */
  updateDestination: async (id, destinationData) => {
    try {
      const response = await API.put(`/destinations/${id}`, destinationData);
      return response.data;
    } catch (error) {
      console.error(`Error updating destination ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete a destination
   * @param {number} id - The destination ID
   * @returns {Promise} Promise object with the result
   */
  deleteDestination: async (id) => {
    try {
      const response = await API.delete(`/destinations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting destination ${id}:`, error);
      throw error;
    }
  },

  /**
   * Format the image URL for a destination
   * @param {string} imageUrl - The raw image URL from the API
   * @returns {string} The formatted image URL
   */
  formatImageUrl: (imageUrl) => {
    if (!imageUrl) {
      return '/images/placeholder-destination.jpg';
    }

    // If it's already a full URL, return it as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // If it's a relative path to the uploads folder
    if (imageUrl.startsWith('destination-images/')) {
      // Get the base URL from the API configuration
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const baseURLWithoutApi = baseURL.replace(/\/api$/, '');
      return `${baseURLWithoutApi}/uploads/${imageUrl}`;
    }

    // Default fallback
    return imageUrl;
  }
};

export default destinationService;
