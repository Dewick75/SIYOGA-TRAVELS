// src/controllers/testVehicleController.js
const { executeQuery } = require('../config/DB/db');
const { catchAsync, ApiError } = require('../utils/errorHandler');
const logger = require('../config/logger');

/**
 * Get available vehicles for testing
 * @route GET /api/test/vehicles/available
 */
const getAvailableVehicles = catchAsync(async (req, res) => {
  const { capacity, tripDate, tripTime } = req.query;

  console.log('Test Vehicle API Request:', {
    capacity,
    tripDate,
    tripTime
  });

  // For testing, we'll return mock data instead of querying the database
  const mockVehicles = [
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
    },
    {
      VehicleID: 4,
      Type: 'Tuk Tuk',
      Make: 'Bajaj',
      Model: 'RE',
      Year: 2021,
      Capacity: 3,
      PricePerDay: 2500,
      Features: ['Economical', 'Nimble', 'Authentic Experience'],
      ImageURL: 'https://via.placeholder.com/300x200?text=Tuk+Tuk',
      DriverID: 4,
      DriverName: 'Asanka Fernando',
      DriverRating: 4.6,
      DriverTotalTrips: 210
    },
    {
      VehicleID: 5,
      Type: 'Luxury Car',
      Make: 'Mercedes-Benz',
      Model: 'E-Class',
      Year: 2022,
      Capacity: 5,
      PricePerDay: 15000,
      Features: ['Leather Seats', 'Climate Control', 'Premium Sound System', 'Navigation'],
      ImageURL: 'https://via.placeholder.com/300x200?text=Mercedes+E-Class',
      DriverID: 5,
      DriverName: 'Dinesh Rajapaksa',
      DriverRating: 4.9,
      DriverTotalTrips: 78
    }
  ];

  // Filter by capacity if provided
  let filteredVehicles = mockVehicles;
  if (capacity) {
    filteredVehicles = mockVehicles.filter(v => v.Capacity >= parseInt(capacity));
  }

  // Simulate a delay for testing loading states
  setTimeout(() => {
    res.json({
      success: true,
      count: filteredVehicles.length,
      data: filteredVehicles
    });
  }, 500);
});

/**
 * Get vehicle details by ID for testing
 * @route GET /api/test/vehicles/:id
 */
const getVehicleById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // For testing, we'll return mock data
  const mockVehicles = [
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
    }
  ];

  const vehicle = mockVehicles.find(v => v.VehicleID === parseInt(id));

  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }

  res.json({
    success: true,
    data: vehicle
  });
});

/**
 * Get real vehicles from database for testing
 * @route GET /api/test/vehicles/real
 */
const getRealVehicles = catchAsync(async (req, res) => {
  try {
    console.log('Attempting to fetch real vehicles from database...');

    // Query to get all active vehicles with driver information
    const query = `
      SELECT
        V.VehicleID,
        V.Type,
        V.Make,
        V.Model,
        V.Year,
        V.LicensePlate,
        V.Capacity,
        V.PricePerDay,
        V.Features,
        V.ImageURL,
        V.Status,
        D.DriverID,
        D.Name AS DriverName,
        D.Rating AS DriverRating,
        D.TotalTrips AS DriverTotalTrips
      FROM Vehicles V
      JOIN Drivers D ON V.DriverID = D.DriverID
      WHERE V.Status = 'Active' AND D.Status = 'Active'
    `;

    const result = await executeQuery(query);

    console.log(`Found ${result.recordset ? result.recordset.length : 0} vehicles in database`);

    // Parse features JSON
    const vehicles = result.recordset.map(vehicle => ({
      ...vehicle,
      Features: vehicle.Features ? JSON.parse(vehicle.Features) : []
    }));

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    console.error('Error fetching real vehicles:', error);

    // If database query fails, return mock data as fallback
    const mockVehicles = [
      {
        VehicleID: 101,
        Type: 'Car',
        Make: 'Toyota',
        Model: 'Camry',
        Year: 2022,
        Capacity: 5,
        PricePerDay: 6000,
        Features: ['Air Conditioning', 'Bluetooth', 'USB Charging', 'Leather Seats'],
        ImageURL: 'https://via.placeholder.com/300x200?text=Toyota+Camry',
        DriverID: 10,
        DriverName: 'Fallback Driver',
        DriverRating: 4.5,
        DriverTotalTrips: 50,
        Status: 'Active'
      }
    ];

    res.json({
      success: true,
      count: mockVehicles.length,
      data: mockVehicles,
      note: 'Using fallback mock data due to database error'
    });
  }
});

module.exports = {
  getAvailableVehicles,
  getVehicleById,
  getRealVehicles
};
