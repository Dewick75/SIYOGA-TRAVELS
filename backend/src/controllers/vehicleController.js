// src/controllers/vehicleController.js
const { executeQuery } = require('../config/DB/db');
const { catchAsync, ApiError } = require('../utils/errorHandler');
const logger = require('../config/logger');

/**
 * Get all vehicles
 * @route GET /api/vehicles
 */
const getAllVehicles = catchAsync(async (req, res) => {
  const { type, capacity, tripDate, tripTime, status = 'Active' } = req.query;

  try {
    console.log('Fetching all vehicles from database with params:', { type, capacity, tripDate, tripTime, status });

    let query = `
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
      WHERE V.Status = @status AND D.Status = 'Active'
    `;

    const params = { status };

    // Add filters if provided
    if (type) {
      query += ` AND V.Type = @type`;
      params.type = type;
    }

    if (capacity) {
      query += ` AND V.Capacity >= @capacity`;
      params.capacity = capacity;
    }

    // Check availability if date and time are provided
    if (tripDate && tripTime) {
      query += `
        AND NOT EXISTS (
          SELECT 1 FROM Bookings B
          WHERE B.VehicleID = V.VehicleID
          AND B.TripDate = @tripDate
          AND B.Status IN ('Pending', 'Confirmed')
        )
      `;
      params.tripDate = tripDate;
    }

    query += ` ORDER BY V.PricePerDay ASC`;

    console.log('Executing SQL query:', query);
    const result = await executeQuery(query, params);
    console.log(`Query returned ${result.recordset ? result.recordset.length : 0} vehicles`);

    // Parse features JSON
    const vehicles = result.recordset.map(vehicle => ({
      ...vehicle,
      Features: vehicle.Features ? JSON.parse(vehicle.Features) : []
    }));

    console.log(`Returning ${vehicles.length} vehicles to client`);

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    logger.error('Error in getAllVehicles:', error);
    throw error;
  }
});

/**
 * Get vehicle by ID
 * @route GET /api/vehicles/:id
 */
const getVehicleById = catchAsync(async (req, res) => {
  const { id } = req.params;

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
      D.PhoneNumber AS DriverPhoneNumber,
      D.Rating AS DriverRating,
      D.TotalTrips AS DriverTotalTrips
    FROM Vehicles V
    JOIN Drivers D ON V.DriverID = D.DriverID
    WHERE V.VehicleID = @id
  `;

  const result = await executeQuery(query, { id });

  if (!result.recordset || result.recordset.length === 0) {
    throw new ApiError(404, 'Vehicle not found');
  }

  const vehicle = result.recordset[0];

  // Parse features JSON if it exists
  vehicle.Features = vehicle.Features ? JSON.parse(vehicle.Features) : [];

  res.json({
    success: true,
    data: vehicle
  });
});

/**
 * Check vehicle availability
 * @route GET /api/vehicles/:id/availability
 */
const checkAvailability = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { tripDate, tripTime } = req.query;

  if (!tripDate) {
    throw new ApiError(400, 'Trip date is required');
  }

  // Check if vehicle exists
  const vehicleQuery = 'SELECT 1 FROM Vehicles WHERE VehicleID = @id';
  const vehicleResult = await executeQuery(vehicleQuery, { id });

  if (!vehicleResult.recordset || vehicleResult.recordset.length === 0) {
    throw new ApiError(404, 'Vehicle not found');
  }

  // Check if vehicle is available on the given date
  const bookingQuery = `
    SELECT 1 FROM Bookings
    WHERE VehicleID = @id
    AND TripDate = @tripDate
    AND Status IN ('Pending', 'Confirmed')
  `;

  const bookingResult = await executeQuery(bookingQuery, {
    id,
    tripDate
  });

  const isAvailable = !(bookingResult.recordset && bookingResult.recordset.length > 0);

  res.json({
    success: true,
    data: {
      isAvailable
    }
  });
});

/**
 * Register a new vehicle (driver only)
 * @route POST /api/vehicles
 */
const registerVehicle = catchAsync(async (req, res) => {
  const {
    type,
    make,
    model,
    year,
    licensePlate,
    capacity,
    pricePerDay,
    features
  } = req.body;

  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;

  if (!driverId) {
    throw new ApiError(403, 'Only drivers can register vehicles');
  }

  // Validate required fields
  if (!type || !make || !model || !year || !licensePlate || !capacity || !pricePerDay) {
    throw new ApiError(400, 'All vehicle details are required');
  }

  // Handle vehicle image if uploaded
  let imageUrl = null;
  if (req.file) {
    // Get the relative path to the vehicle image
    imageUrl = req.file.path.replace(/\\/g, '/').split('uploads/')[1];
    logger.info(`Vehicle image uploaded: ${imageUrl}`);
  }

  // Convert features array to JSON string
  const featuresJson = features ? JSON.stringify(features) : null;

  // Check if license plate already exists
  const checkQuery = 'SELECT 1 FROM Vehicles WHERE LicensePlate = @licensePlate';
  const checkResult = await executeQuery(checkQuery, { licensePlate });

  if (checkResult.recordset && checkResult.recordset.length > 0) {
    throw new ApiError(400, 'Vehicle with this license plate already exists');
  }

  // Insert vehicle
  const query = `
    INSERT INTO Vehicles (
      DriverID, Type, Make, Model, Year, LicensePlate,
      Capacity, PricePerDay, Features, ImageURL, Status
    )
    VALUES (
      @driverId, @type, @make, @model, @year, @licensePlate,
      @capacity, @pricePerDay, @features, @imageUrl, 'Active'
    );

    SELECT SCOPE_IDENTITY() AS VehicleID;
  `;

  const result = await executeQuery(query, {
    driverId,
    type,
    make,
    model,
    year,
    licensePlate,
    capacity,
    pricePerDay,
    features: featuresJson,
    imageUrl: imageUrl
  });

  if (!result.recordset || !result.recordset[0]) {
    throw new ApiError(500, 'Failed to register vehicle');
  }

  const vehicleId = result.recordset[0].VehicleID;

  // Get the newly created vehicle
  const newVehicle = await executeQuery(
    `SELECT * FROM Vehicles WHERE VehicleID = @id`,
    { id: vehicleId }
  );

  // Parse features JSON
  const vehicle = {
    ...newVehicle.recordset[0],
    Features: newVehicle.recordset[0].Features
      ? JSON.parse(newVehicle.recordset[0].Features)
      : []
  };

  logger.info(`New vehicle registered: ${make} ${model} (${licensePlate})`);

  res.status(201).json({
    success: true,
    message: 'Vehicle registered successfully',
    data: vehicle
  });
});

/**
 * Update a vehicle (driver/owner only)
 * @route PUT /api/vehicles/:id
 */
const updateVehicle = catchAsync(async (req, res) => {
  const { id } = req.params;
  const {
    type,
    make,
    model,
    year,
    licensePlate,
    capacity,
    pricePerDay,
    features,
    status
  } = req.body;

  // Handle vehicle image if uploaded
  let imageUrl = undefined;
  if (req.file) {
    // Get the relative path to the vehicle image
    imageUrl = req.file.path.replace(/\\/g, '/').split('uploads/')[1];
    logger.info(`Vehicle image updated: ${imageUrl}`);
  }

  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;

  // Check if vehicle exists and belongs to the driver
  const checkQuery = `
    SELECT 1 FROM Vehicles
    WHERE VehicleID = @id AND DriverID = @driverId
  `;

  const checkResult = await executeQuery(checkQuery, { id, driverId });

  if (!checkResult.recordset || checkResult.recordset.length === 0) {
    throw new ApiError(404, 'Vehicle not found or you do not have permission to update it');
  }

  // Convert features array to JSON string
  const featuresJson = features ? JSON.stringify(features) : undefined;

  // Build update query
  let updateQuery = 'UPDATE Vehicles SET ';
  const params = { id };
  const updates = [];

  if (type) {
    updates.push('Type = @type');
    params.type = type;
  }

  if (make) {
    updates.push('Make = @make');
    params.make = make;
  }

  if (model) {
    updates.push('Model = @model');
    params.model = model;
  }

  if (year) {
    updates.push('Year = @year');
    params.year = year;
  }

  if (licensePlate) {
    // Check if new license plate already exists for a different vehicle
    if (licensePlate) {
      const licenseCheckQuery = `
        SELECT 1 FROM Vehicles
        WHERE LicensePlate = @licensePlate AND VehicleID != @id
      `;
      const licenseCheckResult = await executeQuery(licenseCheckQuery, {
        licensePlate,
        id
      });

      if (licenseCheckResult.recordset && licenseCheckResult.recordset.length > 0) {
        throw new ApiError(400, 'Another vehicle with this license plate already exists');
      }
    }

    updates.push('LicensePlate = @licensePlate');
    params.licensePlate = licensePlate;
  }

  if (capacity) {
    updates.push('Capacity = @capacity');
    params.capacity = capacity;
  }

  if (pricePerDay) {
    updates.push('PricePerDay = @pricePerDay');
    params.pricePerDay = pricePerDay;
  }

  if (featuresJson !== undefined) {
    updates.push('Features = @features');
    params.features = featuresJson;
  }

  if (imageUrl !== undefined) {
    updates.push('ImageURL = @imageUrl');
    params.imageUrl = imageUrl;
  }

  if (status) {
    updates.push('Status = @status');
    params.status = status;
  }

  if (updates.length === 0) {
    throw new ApiError(400, 'No updates provided');
  }

  updateQuery += updates.join(', ');
  updateQuery += ', UpdatedAt = GETDATE() WHERE VehicleID = @id';

  await executeQuery(updateQuery, params);

  // Get the updated vehicle
  const updatedVehicle = await executeQuery(
    'SELECT * FROM Vehicles WHERE VehicleID = @id',
    { id }
  );

  // Parse features JSON
  const vehicle = {
    ...updatedVehicle.recordset[0],
    Features: updatedVehicle.recordset[0].Features
      ? JSON.parse(updatedVehicle.recordset[0].Features)
      : []
  };

  logger.info(`Vehicle updated: ${id}`);

  res.json({
    success: true,
    message: 'Vehicle updated successfully',
    data: vehicle
  });
});

/**
 * Delete a vehicle (driver/owner only)
 * @route DELETE /api/vehicles/:id
 */
const deleteVehicle = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;

  // Check if vehicle exists and belongs to the driver
  const checkQuery = `
    SELECT 1 FROM Vehicles
    WHERE VehicleID = @id AND DriverID = @driverId
  `;

  const checkResult = await executeQuery(checkQuery, { id, driverId });

  if (!checkResult.recordset || checkResult.recordset.length === 0) {
    throw new ApiError(404, 'Vehicle not found or you do not have permission to delete it');
  }

  // Check if vehicle is used in any bookings
  const bookingQuery = `
    SELECT 1 FROM Bookings
    WHERE VehicleID = @id AND Status IN ('Pending', 'Confirmed')
  `;

  const bookingResult = await executeQuery(bookingQuery, { id });

  if (bookingResult.recordset && bookingResult.recordset.length > 0) {
    // Set status to inactive instead of deleting
    await executeQuery(
      'UPDATE Vehicles SET Status = @status, UpdatedAt = GETDATE() WHERE VehicleID = @id',
      { id, status: 'Inactive' }
    );

    logger.info(`Vehicle marked as inactive: ${id}`);

    return res.json({
      success: true,
      message: 'Vehicle has active bookings and has been marked as inactive'
    });
  }

  // Delete the vehicle
  await executeQuery('DELETE FROM Vehicles WHERE VehicleID = @id', { id });

  logger.info(`Vehicle deleted: ${id}`);

  res.json({
    success: true,
    message: 'Vehicle deleted successfully'
  });
});

/**
 * Get vehicles registered by a specific driver
 * @route GET /api/vehicles/driver
 */
const getDriverVehicles = catchAsync(async (req, res) => {
  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;

  if (!driverId) {
    throw new ApiError(403, 'Only drivers can access their vehicles');
  }

  const query = `
    SELECT
      VehicleID,
      Type,
      Make,
      Model,
      Year,
      LicensePlate,
      Capacity,
      PricePerDay,
      Features,
      ImageURL,
      Status
    FROM Vehicles
    WHERE DriverID = @driverId
    ORDER BY Status ASC, UpdatedAt DESC
  `;

  const result = await executeQuery(query, { driverId });

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
});

module.exports = {
  getAllVehicles,
  getVehicleById,
  checkAvailability,
  registerVehicle,
  updateVehicle,
  deleteVehicle,
  getDriverVehicles
};