// src/controllers/tripPlanningController.js
const { executeQuery } = require('../utils/dbUtils');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const catchAsync = require('../utils/catchAsync');

/**
 * Get all destinations
 * @route GET /api/trip-planning/destinations
 */
const getAllDestinations = catchAsync(async (req, res) => {
  const query = `
    SELECT
      destination_id,
      name,
      province,
      region,
      description
    FROM Destinations
    ORDER BY name ASC
  `;

  const result = await executeQuery(query);

  res.json({
    success: true,
    count: result.recordset.length,
    data: result.recordset
  });
});

/**
 * Get destination by ID
 * @route GET /api/trip-planning/destinations/:id
 */
const getDestinationById = catchAsync(async (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT
      destination_id,
      name,
      province,
      region,
      description
    FROM Destinations
    WHERE destination_id = @id
  `;

  const result = await executeQuery(query, { id });

  if (!result.recordset || result.recordset.length === 0) {
    throw new ApiError(404, 'Destination not found');
  }

  res.json({
    success: true,
    data: result.recordset[0]
  });
});

/**
 * Get distance between two destinations
 * @route GET /api/trip-planning/distances
 */
const getDistance = catchAsync(async (req, res) => {
  const { fromId, toId } = req.query;

  if (!fromId || !toId) {
    throw new ApiError(400, 'Both fromId and toId are required');
  }

  const query = `
    SELECT
      from_id,
      to_id,
      distance_km,
      duration_hours
    FROM Distances
    WHERE from_id = @fromId AND to_id = @toId
  `;

  const result = await executeQuery(query, { fromId, toId });

  if (!result.recordset || result.recordset.length === 0) {
    // Instead of throwing an error, return estimated data
    logger.warn(`Distance information not found for from_id=${fromId} to to_id=${toId}. Using estimate.`);

    // Get destination names for logging
    const fromDestQuery = `SELECT name FROM Destinations WHERE destination_id = @id`;
    const toDestQuery = `SELECT name FROM Destinations WHERE destination_id = @id`;

    const fromDestResult = await executeQuery(fromDestQuery, { id: fromId });
    const toDestResult = await executeQuery(toDestQuery, { id: toId });

    const fromName = fromDestResult.recordset && fromDestResult.recordset[0] ? fromDestResult.recordset[0].name : 'Unknown';
    const toName = toDestResult.recordset && toDestResult.recordset[0] ? toDestResult.recordset[0].name : 'Unknown';

    logger.info(`Estimating distance from ${fromName} to ${toName}`);

    // Return estimated data
    return res.json({
      success: true,
      estimated: true,
      data: {
        from_id: parseInt(fromId),
        to_id: parseInt(toId),
        distance_km: 50, // Default 50 km
        duration_hours: 1.25 // Default 1.25 hours (50 km at 40 km/h)
      }
    });
  }

  res.json({
    success: true,
    data: result.recordset[0]
  });
});

/**
 * Create a new trip
 * @route POST /api/trip-planning/trips
 */
const createTrip = catchAsync(async (req, res) => {
  const {
    startDate,
    endDate,
    totalDistance,
    totalDays,
    estimatedCost
  } = req.body;

  // Get traveler ID from authenticated user
  const travelerId = req.user.user_id;

  // Validate required fields
  if (!startDate || !endDate) {
    throw new ApiError(400, 'Start date and end date are required');
  }

  // Create trip
  const query = `
    INSERT INTO Trips (
      traveler_id,
      start_date,
      end_date,
      total_distance,
      total_days,
      estimated_cost,
      created_at
    )
    VALUES (
      @travelerId,
      @startDate,
      @endDate,
      @totalDistance,
      @totalDays,
      @estimatedCost,
      GETDATE()
    );

    SELECT SCOPE_IDENTITY() AS trip_id;
  `;

  const result = await executeQuery(query, {
    travelerId,
    startDate,
    endDate,
    totalDistance: totalDistance || null,
    totalDays: totalDays || null,
    estimatedCost: estimatedCost || null
  });

  if (!result.recordset || !result.recordset[0]) {
    throw new ApiError(500, 'Failed to create trip');
  }

  const tripId = result.recordset[0].trip_id;

  logger.info(`Trip created with ID: ${tripId} for traveler: ${travelerId}`);

  res.status(201).json({
    success: true,
    message: 'Trip created successfully',
    data: {
      tripId,
      startDate,
      endDate,
      totalDistance,
      totalDays,
      estimatedCost
    }
  });
});

/**
 * Add a stop to a trip
 * @route POST /api/trip-planning/trips/:tripId/stops
 */
const addTripStop = catchAsync(async (req, res) => {
  const { tripId } = req.params;
  const {
    destinationId,
    stopOrder,
    tripDay,
    overnightStay,
    stopNotes
  } = req.body;

  // Get traveler ID from authenticated user
  const travelerId = req.user.user_id;

  // Validate required fields
  if (!destinationId || !stopOrder) {
    throw new ApiError(400, 'Destination ID and stop order are required');
  }

  // Check if trip exists and belongs to the traveler
  const tripQuery = `
    SELECT trip_id
    FROM Trips
    WHERE trip_id = @tripId AND traveler_id = @travelerId
  `;

  const tripResult = await executeQuery(tripQuery, { tripId, travelerId });

  if (!tripResult.recordset || tripResult.recordset.length === 0) {
    throw new ApiError(404, 'Trip not found or you do not have permission to modify it');
  }

  // Add trip stop
  const query = `
    INSERT INTO TripStops (
      trip_id,
      destination_id,
      stop_order,
      trip_day,
      overnight_stay,
      stop_notes
    )
    VALUES (
      @tripId,
      @destinationId,
      @stopOrder,
      @tripDay,
      @overnightStay,
      @stopNotes
    );

    SELECT SCOPE_IDENTITY() AS stop_id;
  `;

  const result = await executeQuery(query, {
    tripId,
    destinationId,
    stopOrder,
    tripDay: tripDay || null,
    overnightStay: overnightStay || 0,
    stopNotes: stopNotes || null
  });

  if (!result.recordset || !result.recordset[0]) {
    throw new ApiError(500, 'Failed to add trip stop');
  }

  const stopId = result.recordset[0].stop_id;

  logger.info(`Trip stop added with ID: ${stopId} for trip: ${tripId}`);

  res.status(201).json({
    success: true,
    message: 'Trip stop added successfully',
    data: {
      stopId,
      tripId,
      destinationId,
      stopOrder,
      tripDay,
      overnightStay,
      stopNotes
    }
  });
});

/**
 * Save trip preferences
 * @route POST /api/trip-planning/trips/:tripId/preferences
 */
const saveTripPreferences = catchAsync(async (req, res) => {
  const { tripId } = req.params;
  const {
    vehicleType,
    budgetRange,
    needGuide,
    needAccommodationHelp,
    specialRequests
  } = req.body;

  // Get traveler ID from authenticated user
  const travelerId = req.user.user_id;

  // Check if trip exists and belongs to the traveler
  const tripQuery = `
    SELECT trip_id
    FROM Trips
    WHERE trip_id = @tripId AND traveler_id = @travelerId
  `;

  const tripResult = await executeQuery(tripQuery, { tripId, travelerId });

  if (!tripResult.recordset || tripResult.recordset.length === 0) {
    throw new ApiError(404, 'Trip not found or you do not have permission to modify it');
  }

  // Save trip preferences
  const query = `
    INSERT INTO TripPreferences (
      trip_id,
      vehicle_type,
      budget_range,
      need_guide,
      need_accommodation_help,
      special_requests
    )
    VALUES (
      @tripId,
      @vehicleType,
      @budgetRange,
      @needGuide,
      @needAccommodationHelp,
      @specialRequests
    );

    SELECT SCOPE_IDENTITY() AS preference_id;
  `;

  const result = await executeQuery(query, {
    tripId,
    vehicleType: vehicleType || null,
    budgetRange: budgetRange || null,
    needGuide: needGuide || 0,
    needAccommodationHelp: needAccommodationHelp || 0,
    specialRequests: specialRequests || null
  });

  if (!result.recordset || !result.recordset[0]) {
    throw new ApiError(500, 'Failed to save trip preferences');
  }

  const preferenceId = result.recordset[0].preference_id;

  logger.info(`Trip preferences saved with ID: ${preferenceId} for trip: ${tripId}`);

  res.status(201).json({
    success: true,
    message: 'Trip preferences saved successfully',
    data: {
      preferenceId,
      tripId,
      vehicleType,
      budgetRange,
      needGuide,
      needAccommodationHelp,
      specialRequests
    }
  });
});

module.exports = {
  getAllDestinations,
  getDestinationById,
  getDistance,
  createTrip,
  addTripStop,
  saveTripPreferences
};
