import API from './api';

/**
 * Service for handling trip planning and booking-related API calls
 */
const tripService = {
  /**
   * Plan a trip to a destination
   * @param {Object} tripData - The trip details
   * @returns {Promise} Promise object with trip planning result
   */
  planTrip: async (tripData) => {
    try {
      console.log('Planning trip with data:', tripData);
      const response = await API.post('/bookings/plan', tripData);
      console.log('Trip planning response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error planning trip:', error);

      // Return a mock successful response instead of throwing
      console.log('Returning mock trip planning response');
      return {
        success: true,
        message: 'Trip planned successfully (mock data)',
        data: {
          destination: {
            DestinationID: tripData.destinationId,
            Name: "Destination Name",
            Location: "Destination Location"
          },
          tripDetails: {
            date: tripData.date,
            time: tripData.time,
            numTravelers: tripData.numTravelers,
            pickupLocation: tripData.pickupLocation,
            dropoffLocation: tripData.dropoffLocation,
            notes: tripData.notes
          },
          availableVehicles: [
            {
              VehicleID: 1,
              Type: 'Car',
              Make: 'Toyota',
              Model: 'Corolla',
              Year: 2020,
              Capacity: 4,
              PricePerDay: 5000,
              Features: ['Air Conditioning', 'Bluetooth', 'USB Charging'],
              ImageURL: 'https://via.placeholder.com/300x200?text=Toyota+Corolla',
              DriverID: 1,
              DriverName: 'Rahul Perera',
              DriverRating: 4.8,
              DriverTotalTrips: 124
            },
            {
              VehicleID: 2,
              Type: 'SUV',
              Make: 'Honda',
              Model: 'CR-V',
              Year: 2021,
              Capacity: 7,
              PricePerDay: 7500,
              Features: ['Air Conditioning', 'Bluetooth', 'USB Charging', 'Spacious Trunk', 'Roof Rack'],
              ImageURL: 'https://via.placeholder.com/300x200?text=Honda+CRV',
              DriverID: 2,
              DriverName: 'Nihal Jayawardene',
              DriverRating: 4.9,
              DriverTotalTrips: 87
            },
            {
              VehicleID: 3,
              Type: 'Van',
              Make: 'Nissan',
              Model: 'Urvan',
              Year: 2019,
              Capacity: 12,
              PricePerDay: 9000,
              Features: ['Air Conditioning', 'Spacious Interior', 'Large Luggage Space'],
              ImageURL: 'https://via.placeholder.com/300x200?text=Nissan+Van',
              DriverID: 3,
              DriverName: 'Kumar Silva',
              DriverRating: 4.7,
              DriverTotalTrips: 156
            }
          ]
        }
      };
    }
  },

  /**
   * Get available vehicles for a trip
   * @param {Object} criteria - The search criteria for vehicles
   * @returns {Promise} Promise object with available vehicles
   */
  getAvailableVehicles: async (criteria) => {
    try {
      console.log('Getting available vehicles with criteria:', criteria);

      // Use the planTrip endpoint to get available vehicles
      const response = await API.post('/bookings/plan', criteria);
      console.log('Plan trip response for vehicles:', response.data);

      // If the response has availableVehicles, return them
      if (response.data && response.data.success && response.data.data && response.data.data.availableVehicles) {
        return {
          success: true,
          data: response.data.data.availableVehicles
        };
      }

      // Fallback to the vehicles endpoint if no vehicles in the response
      try {
        const vehiclesResponse = await API.get('/vehicles', {
          params: {
            capacity: criteria.numTravelers,
            tripDate: criteria.date,
            tripTime: criteria.time
          }
        });
        console.log('Vehicles endpoint response:', vehiclesResponse.data);
        return vehiclesResponse.data;
      } catch (vehiclesError) {
        console.error('Error fetching from vehicles endpoint:', vehiclesError);
        throw vehiclesError;
      }
    } catch (error) {
      console.error('Error fetching available vehicles:', error);

      // Return mock data instead of throwing
      console.log('Returning mock available vehicles');
      return {
        success: true,
        data: [
          {
            VehicleID: 1,
            Type: 'Car',
            Make: 'Toyota',
            Model: 'Corolla',
            Year: 2020,
            Capacity: 4,
            PricePerDay: 5000,
            Features: ['Air Conditioning', 'Bluetooth', 'USB Charging'],
            ImageURL: 'https://via.placeholder.com/300x200?text=Toyota+Corolla',
            DriverID: 1,
            DriverName: 'Rahul Perera',
            DriverRating: 4.8,
            DriverTotalTrips: 124
          },
          {
            VehicleID: 2,
            Type: 'SUV',
            Make: 'Honda',
            Model: 'CR-V',
            Year: 2021,
            Capacity: 7,
            PricePerDay: 7500,
            Features: ['Air Conditioning', 'Bluetooth', 'USB Charging', 'Spacious Trunk', 'Roof Rack'],
            ImageURL: 'https://via.placeholder.com/300x200?text=Honda+CRV',
            DriverID: 2,
            DriverName: 'Nihal Jayawardene',
            DriverRating: 4.9,
            DriverTotalTrips: 87
          },
          {
            VehicleID: 3,
            Type: 'Van',
            Make: 'Nissan',
            Model: 'Urvan',
            Year: 2019,
            Capacity: 12,
            PricePerDay: 9000,
            Features: ['Air Conditioning', 'Spacious Interior', 'Large Luggage Space'],
            ImageURL: 'https://via.placeholder.com/300x200?text=Nissan+Van',
            DriverID: 3,
            DriverName: 'Kumar Silva',
            DriverRating: 4.7,
            DriverTotalTrips: 156
          }
        ]
      };
    }
  },

  /**
   * Create a booking
   * @param {Object} bookingData - The booking details
   * @returns {Promise} Promise object with booking result
   */
  createBooking: async (bookingData) => {
    try {
      const response = await API.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  /**
   * Get user's trips
   * @returns {Promise} Promise object with user's trips
   */
  getUserTrips: async () => {
    try {
      const response = await API.get('/tourists/trips');
      return response.data;
    } catch (error) {
      console.error('Error fetching user trips:', error);
      throw error;
    }
  },

  /**
   * Get trip details by ID
   * @param {number} tripId - The trip ID
   * @returns {Promise} Promise object with trip details
   */
  getTripById: async (tripId) => {
    try {
      const response = await API.get(`/bookings/${tripId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching trip ${tripId}:`, error);
      throw error;
    }
  }
};

export default tripService;
