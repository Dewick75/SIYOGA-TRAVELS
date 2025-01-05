// src/services/tripPlanningService.js
import API from './api';

/**
 * Service for handling trip planning API calls
 */
const tripPlanningService = {
  /**
   * Get all destinations
   * @returns {Promise} Promise object with destinations
   */
  getAllDestinations: async () => {
    try {
      const response = await API.get('/trip-planning/destinations');
      return response.data;
    } catch (error) {
      console.error('Error fetching destinations:', error);
      throw error;
    }
  },

  /**
   * Get destination by ID
   * @param {number} id - The destination ID
   * @returns {Promise} Promise object with destination details
   */
  getDestinationById: async (id) => {
    try {
      const response = await API.get(`/trip-planning/destinations/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching destination ${id}:`, error);
      throw error;
    }
  },

  /**
   * Get distance between two destinations
   * @param {number} fromId - The origin destination ID
   * @param {number} toId - The target destination ID
   * @returns {Promise} Promise object with distance information
   */
  getDistance: async (fromId, toId) => {
    try {
      const response = await API.get(`/trip-planning/distances?fromId=${fromId}&toId=${toId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching distance from ${fromId} to ${toId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new trip
   * @param {Object} tripData - The trip data
   * @returns {Promise} Promise object with created trip
   */
  createTrip: async (tripData) => {
    try {
      const response = await API.post('/trip-planning/trips', tripData);
      return response.data;
    } catch (error) {
      console.error('Error creating trip:', error);
      throw error;
    }
  },

  /**
   * Add a stop to a trip
   * @param {number} tripId - The trip ID
   * @param {Object} stopData - The stop data
   * @returns {Promise} Promise object with created stop
   */
  addTripStop: async (tripId, stopData) => {
    try {
      const response = await API.post(`/trip-planning/trips/${tripId}/stops`, stopData);
      return response.data;
    } catch (error) {
      console.error(`Error adding stop to trip ${tripId}:`, error);
      throw error;
    }
  },

  /**
   * Save trip preferences
   * @param {number} tripId - The trip ID
   * @param {Object} preferencesData - The preferences data
   * @returns {Promise} Promise object with saved preferences
   */
  saveTripPreferences: async (tripId, preferencesData) => {
    try {
      const response = await API.post(`/trip-planning/trips/${tripId}/preferences`, preferencesData);
      return response.data;
    } catch (error) {
      console.error(`Error saving preferences for trip ${tripId}:`, error);
      throw error;
    }
  },

  /**
   * Calculate trip details (distance, duration, cost)
   * @param {Array} stops - Array of destination IDs in order
   * @returns {Object} Trip details including total distance, duration, and estimated cost
   */
  calculateTripDetails: async (stops) => {
    try {
      let totalDistance = 0;
      let totalDuration = 0;

      // Calculate distance and duration between consecutive stops
      for (let i = 0; i < stops.length - 1; i++) {
        const fromId = stops[i];
        const toId = stops[i + 1];

        // Check if either ID is a custom destination (starts with 'custom-')
        const isCustomFrom = fromId.toString().startsWith('custom-');
        const isCustomTo = toId.toString().startsWith('custom-');

        if (isCustomFrom || isCustomTo) {
          // For custom destinations, we use a fixed estimate
          // In a real app, you would calculate this using the Google Maps Distance Matrix API
          totalDistance += 50;
          totalDuration += 1.25;
          console.log(`Using estimated distance for custom destination(s): ${fromId} to ${toId}`);
        } else {
          // For regular destinations, use the API
          try {
            const distanceData = await tripPlanningService.getDistance(fromId, toId);

            if (distanceData && distanceData.success && distanceData.data) {
              totalDistance += distanceData.data.distance_km;
              totalDuration += distanceData.data.duration_hours;
            } else {
              // If no distance data is found, use an estimate
              // Assuming average speed of 40 km/h and a straight-line distance of 50 km between destinations
              totalDistance += 50;
              totalDuration += 1.25;
              console.log(`Using estimated distance for ${fromId} to ${toId}`);
            }
          } catch (err) {
            // If API call fails, use an estimate
            totalDistance += 50;
            totalDuration += 1.25;
            console.log(`Using estimated distance for ${fromId} to ${toId} due to error:`, err.message);
          }
        }
      }

      // Estimate cost based on distance (simple formula for now)
      // Assuming LKR 50 per km as a base rate
      const estimatedCost = totalDistance * 50;

      return {
        totalDistance,
        totalDuration,
        estimatedCost,
        totalDays: Math.ceil(totalDuration / 8) // Assuming 8 hours of travel per day
      };
    } catch (error) {
      console.error('Error calculating trip details:', error);
      throw error;
    }
  }
};

export default tripPlanningService;
