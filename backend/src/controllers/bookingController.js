// src/controllers/bookingController.js
const { executeQuery } = require('../config/DB/db');
const { catchAsync, ApiError } = require('../utils/errorHandler');
const { sendEmail } = require('../services/emailService');
const logger = require('../config/logger');

/**
 * Get all bookings (admin only)
 * @route GET /api/bookings
 */
const getAllBookings = catchAsync(async (req, res) => {
  const { status, startDate, endDate } = req.query;

  let query = `
    SELECT
      B.BookingID,
      B.TripDate,
      B.TripTime,
      B.Status,
      B.TotalAmount,
      B.Notes,
      B.CreatedAt,
      T.TouristID,
      T.Name AS TouristName,
      T.PhoneNumber AS TouristPhone,
      D.DriverID,
      D.Name AS DriverName,
      D.PhoneNumber AS DriverPhone,
      V.VehicleID,
      V.Make + ' ' + V.Model AS VehicleName,
      V.Type AS VehicleType,
      V.LicensePlate,
      DS.DestinationID,
      DS.Name AS DestinationName,
      DS.Location AS DestinationLocation
    FROM Bookings B
    JOIN Tourists T ON B.TouristID = T.TouristID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
  `;

  const params = {};
  const conditions = [];

  // Add filters if provided
  if (status) {
    conditions.push('B.Status = @status');
    params.status = status;
  }

  if (startDate) {
    conditions.push('B.TripDate >= @startDate');
    params.startDate = startDate;
  }

  if (endDate) {
    conditions.push('B.TripDate <= @endDate');
    params.endDate = endDate;
  }

  // Add WHERE clause if any conditions
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Order by trip date
  query += ' ORDER BY B.TripDate DESC, B.TripTime DESC';

  const result = await executeQuery(query, params);

  res.json({
    success: true,
    count: result.recordset.length,
    data: result.recordset
  });
});

/**
 * Get booking by ID
 * @route GET /api/bookings/:id
 */
const getBookingById = catchAsync(async (req, res) => {
  const { id } = req.params;

  // Check user authorization
  const isTourist = req.user.Role === 'Tourist';
  const isDriver = req.user.Role === 'Driver';
  const isAdmin = req.user.Role === 'Admin';

  // Base query to get booking details
  let query = `
    SELECT
      B.BookingID,
      B.TripDate,
      B.TripTime,
      B.PickupLocation,
      B.DropoffLocation,
      B.Status,
      B.TotalAmount,
      B.Notes,
      B.CreatedAt,
      B.Itinerary,
      B.CancellationReason,
      T.TouristID,
      T.Name AS TouristName,
      T.PhoneNumber AS TouristPhone,
      D.DriverID,
      D.Name AS DriverName,
      D.PhoneNumber AS DriverPhone,
      V.VehicleID,
      V.Make + ' ' + V.Model AS VehicleName,
      V.Type AS VehicleType,
      V.LicensePlate,
      DS.DestinationID,
      DS.Name AS DestinationName,
      DS.Location AS DestinationLocation,
      P.PaymentID,
      P.Method AS PaymentMethod,
      P.Status AS PaymentStatus,
      P.Amount AS PaymentAmount,
      P.TransactionID
    FROM Bookings B
    JOIN Tourists T ON B.TouristID = T.TouristID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    WHERE B.BookingID = @id
  `;

  // If user is tourist or driver, add authorization constraint
  if (isTourist) {
    query += ` AND T.TouristID = @userId`;
  } else if (isDriver) {
    query += ` AND D.DriverID = @userId`;
  }

  const result = await executeQuery(query, {
    id,
    userId: req.user.RoleID
  });

  if (!result.recordset || result.recordset.length === 0) {
    throw new ApiError(404, 'Booking not found or you do not have permission to view it');
  }

  const booking = result.recordset[0];

  // Parse Itinerary JSON if it exists
  if (booking.Itinerary) {
    try {
      booking.Itinerary = JSON.parse(booking.Itinerary);
    } catch (error) {
      logger.error(`Error parsing booking itinerary: ${error.message}`);
      booking.Itinerary = [];
    }
  } else {
    booking.Itinerary = [];
  }

  res.json({
    success: true,
    data: booking
  });
});

/**
 * Create a new booking (tourist only)
 * @route POST /api/bookings
 */
const createBooking = catchAsync(async (req, res) => {
  const {
    vehicleId,
    destinationId,
    tripDate,
    tripTime,
    pickupLocation,
    dropoffLocation,
    itinerary,
    notes,
    paymentMethod,
    totalAmount
  } = req.body;

  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;

  if (!touristId) {
    throw new ApiError(403, 'Only tourists can create bookings');
  }

  // Validate required fields
  if (!vehicleId || !tripDate || !tripTime || !pickupLocation || !totalAmount) {
    throw new ApiError(400, 'Required booking information is missing');
  }

  // Check vehicle availability
  const availabilityQuery = `
    SELECT 1 FROM Bookings
    WHERE VehicleID = @vehicleId
    AND TripDate = @tripDate
    AND Status IN ('Pending', 'Confirmed')
  `;

  const availabilityResult = await executeQuery(availabilityQuery, {
    vehicleId,
    tripDate
  });

  if (availabilityResult.recordset && availabilityResult.recordset.length > 0) {
    throw new ApiError(400, 'Vehicle is not available on the selected date');
  }

  // Convert itinerary array to JSON string
  const itineraryJson = itinerary ? JSON.stringify(itinerary) : null;

  // Begin transaction
  const transaction = await executeQuery('BEGIN TRANSACTION');

  try {
    // Insert booking
    const bookingQuery = `
      INSERT INTO Bookings (
        TouristID, VehicleID, DestinationID, TripDate, TripTime,
        PickupLocation, DropoffLocation, Status, TotalAmount, Notes, Itinerary
      )
      VALUES (
        @touristId, @vehicleId, @destinationId, @tripDate, @tripTime,
        @pickupLocation, @dropoffLocation, 'Pending', @totalAmount, @notes, @itinerary
      );

      SELECT SCOPE_IDENTITY() AS BookingID;
    `;

    const bookingResult = await executeQuery(bookingQuery, {
      touristId,
      vehicleId,
      destinationId: destinationId || null,
      tripDate,
      tripTime,
      pickupLocation,
      dropoffLocation: dropoffLocation || null,
      totalAmount,
      notes: notes || null,
      itinerary: itineraryJson
    });

    if (!bookingResult.recordset || !bookingResult.recordset[0]) {
      throw new ApiError(500, 'Failed to create booking');
    }

    const bookingId = bookingResult.recordset[0].BookingID;

    // Insert payment record
    const paymentQuery = `
      INSERT INTO Payments (
        BookingID, Method, Amount, Status
      )
      VALUES (
        @bookingId, @paymentMethod, @totalAmount, 'Pending'
      );

      SELECT SCOPE_IDENTITY() AS PaymentID;
    `;

    const paymentResult = await executeQuery(paymentQuery, {
      bookingId,
      paymentMethod: paymentMethod || 'Online',
      totalAmount
    });

    // Commit transaction
    await executeQuery('COMMIT TRANSACTION');

    // Get the newly created booking with details
    const newBooking = await executeQuery(`
      SELECT
        B.BookingID,
        B.TripDate,
        B.TripTime,
        B.PickupLocation,
        B.Status,
        B.TotalAmount,
        V.Make + ' ' + V.Model AS VehicleName,
        D.Name AS DriverName,
        D.PhoneNumber AS DriverPhone,
        DS.Name AS DestinationName
      FROM Bookings B
      JOIN Vehicles V ON B.VehicleID = V.VehicleID
      JOIN Drivers D ON V.DriverID = D.DriverID
      LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
      WHERE B.BookingID = @bookingId
    `, { bookingId });

    const booking = newBooking.recordset[0];

    // Send notifications
    // To Driver - Get driver email
    const driverQuery = `
      SELECT U.Email
      FROM Users U
      JOIN Drivers D ON U.UserID = D.UserID
      JOIN Vehicles V ON D.DriverID = V.DriverID
      WHERE V.VehicleID = @vehicleId
    `;

    const driverResult = await executeQuery(driverQuery, { vehicleId });

    if (driverResult.recordset && driverResult.recordset[0]) {
      const driverEmail = driverResult.recordset[0].Email;

      // Send email to driver
      await sendEmail({
        to: driverEmail,
        subject: 'New Booking Request',
        text: `You have a new booking request for ${booking.TripDate}. Please log in to your account to view details.`
      });
    }

    // To Tourist - confirmation email
    await sendEmail({
      to: req.user.Email,
      subject: 'Booking Confirmation - Siyoga Travels',
      text: `Your booking has been created successfully. Booking ID: ${bookingId}. Date: ${booking.TripDate}. Please complete the payment to confirm your trip.`
    });

    logger.info(`New booking created: ${bookingId}`);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId,
        ...booking
      }
    });
  } catch (error) {
    // Rollback transaction in case of error
    await executeQuery('ROLLBACK TRANSACTION');
    throw error;
  }
});

/**
 * Update booking status (admin/driver)
 * @route PATCH /api/bookings/:id/status
 */
const updateBookingStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  // Validate status
  const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
  if (!status || !validStatuses.includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  // Check user authorization
  const isDriver = req.user.Role === 'Driver';
  const isAdmin = req.user.Role === 'Admin';

  if (!isDriver && !isAdmin) {
    throw new ApiError(403, 'You do not have permission to update booking status');
  }

  // Get current booking details
  const bookingQuery = `
    SELECT
      B.BookingID,
      B.Status AS CurrentStatus,
      B.TouristID,
      D.DriverID,
      V.VehicleID
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    WHERE B.BookingID = @id
  `;

  const bookingResult = await executeQuery(bookingQuery, { id });

  if (!bookingResult.recordset || bookingResult.recordset.length === 0) {
    throw new ApiError(404, 'Booking not found');
  }

  const booking = bookingResult.recordset[0];

  // If user is driver, check if booking belongs to them
  if (isDriver && booking.DriverID != req.user.RoleID) {
    throw new ApiError(403, 'You do not have permission to update this booking');
  }

  // Don't allow changing from Cancelled or Completed to other statuses
  if ((booking.CurrentStatus === 'Cancelled' || booking.CurrentStatus === 'Completed') && status !== booking.CurrentStatus) {
    throw new ApiError(400, `Cannot change status from ${booking.CurrentStatus}`);
  }

  // Update booking status
  const updateQuery = `
    UPDATE Bookings
    SET Status = @status
    ${status === 'Cancelled' ? ', CancellationReason = @reason' : ''}
    , UpdatedAt = GETDATE()
    WHERE BookingID = @id
  `;

  await executeQuery(updateQuery, {
    id,
    status,
    reason: status === 'Cancelled' ? (reason || 'No reason provided') : null
  });

  // Get tourist email for notification
  const touristQuery = `
    SELECT U.Email, T.Name
    FROM Users U
    JOIN Tourists T ON U.UserID = T.UserID
    WHERE T.TouristID = @touristId
  `;

  const touristResult = await executeQuery(touristQuery, { touristId: booking.TouristID });

  if (touristResult.recordset && touristResult.recordset[0]) {
    const touristEmail = touristResult.recordset[0].Email;
    const touristName = touristResult.recordset[0].Name;

    // Send email notification to tourist about status change
    await sendEmail({
      to: touristEmail,
      subject: `Booking Status Updated - ${status}`,
      text: `Dear ${touristName}, your booking (ID: ${id}) status has been updated to ${status}.
      ${status === 'Cancelled' ? `Reason: ${reason || 'No reason provided'}` : ''}
      Please log in to your account for more details.`
    });
  }

  // If booking is cancelled, also notify driver
  if (status === 'Cancelled') {
    const driverQuery = `
      SELECT U.Email, D.Name
      FROM Users U
      JOIN Drivers D ON U.UserID = D.UserID
      WHERE D.DriverID = @driverId
    `;

    const driverResult = await executeQuery(driverQuery, { driverId: booking.DriverID });

    if (driverResult.recordset && driverResult.recordset[0]) {
      const driverEmail = driverResult.recordset[0].Email;
      const driverName = driverResult.recordset[0].Name;

      // Send email notification to driver about cancellation
      await sendEmail({
        to: driverEmail,
        subject: 'Booking Cancelled',
        text: `Dear ${driverName}, booking (ID: ${id}) has been cancelled.
        Reason: ${reason || 'No reason provided'}
        Please log in to your account for more details.`
      });
    }
  }

  logger.info(`Booking status updated: ${id} -> ${status}`);

  res.json({
    success: true,
    message: `Booking status updated to ${status}`,
    data: {
      bookingId: id,
      status
    }
  });
});

/**
 * Get bookings for authenticated tourist
 * @route GET /api/bookings/tourist
 */
const getTouristBookings = catchAsync(async (req, res) => {
  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;

  if (!touristId) {
    throw new ApiError(403, 'Not authorized as tourist');
  }

  const { status } = req.query;

  let query = `
    SELECT
      B.BookingID,
      B.TripDate,
      B.TripTime,
      B.PickupLocation,
      B.DropoffLocation,
      B.Status,
      B.TotalAmount,
      B.CreatedAt,
      V.VehicleID,
      V.Make + ' ' + V.Model AS VehicleName,
      V.Type AS VehicleType,
      D.DriverID,
      D.Name AS DriverName,
      DS.DestinationID,
      DS.Name AS DestinationName,
      P.Status AS PaymentStatus
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    WHERE B.TouristID = @touristId
  `;

  const params = { touristId };

  // Add status filter if provided
  if (status) {
    query += ` AND B.Status = @status`;
    params.status = status;
  }

  // Order by trip date
  query += ` ORDER BY B.TripDate DESC, B.TripTime DESC`;

  const result = await executeQuery(query, params);

  res.json({
    success: true,
    count: result.recordset.length,
    data: result.recordset
  });
});

/**
 * Get bookings for authenticated driver
 * @route GET /api/bookings/driver
 */
const getDriverBookings = catchAsync(async (req, res) => {
  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;

  if (!driverId) {
    throw new ApiError(403, 'Not authorized as driver');
  }

  const { status } = req.query;

  let query = `
    SELECT
      B.BookingID,
      B.TripDate,
      B.TripTime,
      B.PickupLocation,
      B.DropoffLocation,
      B.Status,
      B.TotalAmount,
      B.CreatedAt,
      T.TouristID,
      T.Name AS TouristName,
      T.PhoneNumber AS TouristPhone,
      V.VehicleID,
      V.Make + ' ' + V.Model AS VehicleName,
      V.Type AS VehicleType,
      DS.DestinationID,
      DS.Name AS DestinationName,
      P.Status AS PaymentStatus
    FROM Bookings B
    JOIN Tourists T ON B.TouristID = T.TouristID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    WHERE D.DriverID = @driverId
  `;

  const params = { driverId };

  // Add status filter if provided
  if (status) {
    query += ` AND B.Status = @status`;
    params.status = status;
  }

  // Order by trip date
  query += ` ORDER BY B.TripDate DESC, B.TripTime DESC`;

  const result = await executeQuery(query, params);

  res.json({
    success: true,
    count: result.recordset.length,
    data: result.recordset
  });
});

/**
 * Cancel booking (tourist only)
 * @route POST /api/bookings/:id/cancel
 */
const cancelBooking = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;

  if (!touristId) {
    throw new ApiError(403, 'Only tourists can cancel their bookings');
  }

  // Check if booking exists and belongs to the tourist
  const checkQuery = `
    SELECT B.Status, B.TripDate, D.DriverID, U.Email AS DriverEmail
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    JOIN Users U ON D.UserID = U.UserID
    WHERE B.BookingID = @id AND B.TouristID = @touristId
  `;

  const checkResult = await executeQuery(checkQuery, { id, touristId });

  if (!checkResult.recordset || checkResult.recordset.length === 0) {
    throw new ApiError(404, 'Booking not found or you do not have permission to cancel it');
  }

  const booking = checkResult.recordset[0];

  // Check if booking can be cancelled
  if (booking.Status === 'Cancelled') {
    throw new ApiError(400, 'Booking is already cancelled');
  }

  if (booking.Status === 'Completed') {
    throw new ApiError(400, 'Cannot cancel a completed booking');
  }

  // Check cancellation policy - e.g., cannot cancel within 24 hours of trip
  const tripDate = new Date(booking.TripDate);
  const now = new Date();
  const timeDifference = tripDate.getTime() - now.getTime();
  const hoursDifference = timeDifference / (1000 * 60 * 60);

  // Cancellation fee logic (can be adjusted based on business rules)
  let cancellationFee = 0;

  if (hoursDifference < 24) {
    cancellationFee = 50; // $50 fee for less than 24 hours
  } else if (hoursDifference < 72) {
    cancellationFee = 20; // $20 fee for less than 72 hours
  }

  // Update booking status
  const updateQuery = `
    UPDATE Bookings
    SET Status = 'Cancelled',
        CancellationReason = @reason,
        CancellationFee = @fee,
        UpdatedAt = GETDATE()
    WHERE BookingID = @id
  `;

  await executeQuery(updateQuery, {
    id,
    reason: reason || 'Cancelled by tourist',
    fee: cancellationFee
  });

  // Notify driver about cancellation
  await sendEmail({
    to: booking.DriverEmail,
    subject: 'Booking Cancelled by Tourist',
    text: `A booking (ID: ${id}) has been cancelled by the tourist.
    Reason: ${reason || 'No reason provided'}
    Cancellation Fee: ${cancellationFee}
    Please log in to your account for more details.`
  });

  logger.info(`Booking cancelled by tourist: ${id}`);

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: {
      bookingId: id,
      cancellationFee
    }
  });
});

/**
 * Get booking statistics for admin dashboard
 * @route GET /api/bookings/statistics
 */
const getBookingStatistics = catchAsync(async (req, res) => {
  // This route is for admin only
  if (req.user.Role !== 'Admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }

  // Total bookings by status
  const statusQuery = `
    SELECT Status, COUNT(*) AS Count
    FROM Bookings
    GROUP BY Status
  `;

  const statusResult = await executeQuery(statusQuery);

  // Recent bookings (last 30 days)
  const recentQuery = `
    SELECT COUNT(*) AS RecentCount
    FROM Bookings
    WHERE CreatedAt >= DATEADD(day, -30, GETDATE())
  `;

  const recentResult = await executeQuery(recentQuery);

  // Total revenue
  const revenueQuery = `
    SELECT SUM(TotalAmount) AS TotalRevenue
    FROM Bookings
    WHERE Status IN ('Confirmed', 'Completed')
  `;

  const revenueResult = await executeQuery(revenueQuery);

  // Monthly bookings (last 6 months)
  const monthlyQuery = `
    SELECT
      DATEPART(YEAR, TripDate) AS Year,
      DATEPART(MONTH, TripDate) AS Month,
      COUNT(*) AS BookingCount,
      SUM(TotalAmount) AS Revenue
    FROM Bookings
    WHERE TripDate >= DATEADD(MONTH, -6, GETDATE())
    GROUP BY DATEPART(YEAR, TripDate), DATEPART(MONTH, TripDate)
    ORDER BY Year, Month
  `;

  const monthlyResult = await executeQuery(monthlyQuery);

  // Popular destinations
  const destinationsQuery = `
    SELECT
      D.DestinationID,
      D.Name,
      COUNT(B.BookingID) AS BookingCount
    FROM Bookings B
    JOIN Destinations D ON B.DestinationID = D.DestinationID
    WHERE B.DestinationID IS NOT NULL
    GROUP BY D.DestinationID, D.Name
    ORDER BY BookingCount DESC
    OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
  `;

  const destinationsResult = await executeQuery(destinationsQuery);

  res.json({
    success: true,
    data: {
      statusCounts: statusResult.recordset,
      recentBookings: recentResult.recordset[0]?.RecentCount || 0,
      totalRevenue: revenueResult.recordset[0]?.TotalRevenue || 0,
      monthlyTrends: monthlyResult.recordset,
      popularDestinations: destinationsResult.recordset
    }
  });
});

/**
 * Plan a trip (tourist only)
 * @route POST /api/bookings/plan
 */
const planTrip = catchAsync(async (req, res) => {
  const {
    destinationId,
    date,
    time,
    numTravelers,
    pickupLocation,
    dropoffLocation,
    notes,
    activities
  } = req.body;

  // Get tourist ID from authenticated user
  const touristId = req.user?.RoleID;

  // Validate required fields
  if (!destinationId || !date || !time || !numTravelers) {
    throw new ApiError(400, 'Required trip information is missing');
  }

  // Check if destination exists
  const destinationQuery = `
    SELECT DestinationID, Name, Location
    FROM Destinations
    WHERE DestinationID = @destinationId AND Status = 'Active'
  `;

  const destinationResult = await executeQuery(destinationQuery, { destinationId });

  if (!destinationResult.recordset || destinationResult.recordset.length === 0) {
    throw new ApiError(404, 'Destination not found or inactive');
  }

  // Convert activities array to JSON string if provided
  const activitiesJson = activities ? JSON.stringify(activities) : null;

  // Store trip plan in TripPlans table (if it exists) or in a temporary storage
  // This is optional and depends on your database schema
  // For now, we'll just return success

  logger.info(`Trip planned by tourist ${touristId || 'anonymous'} to destination ${destinationId}`);

  // Get available vehicles based on trip requirements
  const vehiclesQuery = `
    SELECT
      V.VehicleID,
      V.Type,
      V.Make,
      V.Model,
      V.Year,
      V.Capacity,
      V.PricePerDay,
      V.Features,
      V.ImageURL,
      D.DriverID,
      D.Name AS DriverName,
      D.Rating AS DriverRating,
      D.TotalTrips AS DriverTotalTrips
    FROM Vehicles V
    JOIN Drivers D ON V.DriverID = D.DriverID
    WHERE V.Status = 'Active' AND D.Status = 'Active'
    AND V.Capacity >= @numTravelers
    AND NOT EXISTS (
      SELECT 1 FROM Bookings B
      WHERE B.VehicleID = V.VehicleID
      AND B.TripDate = @date
      AND B.Status IN ('Pending', 'Confirmed')
    )
    ORDER BY V.PricePerDay ASC
  `;

  const vehiclesResult = await executeQuery(vehiclesQuery, {
    numTravelers,
    date
  });

  // Parse features JSON
  const vehicles = vehiclesResult.recordset.map(vehicle => ({
    ...vehicle,
    Features: vehicle.Features ? JSON.parse(vehicle.Features) : []
  }));

  res.json({
    success: true,
    message: 'Trip planned successfully',
    data: {
      destination: destinationResult.recordset[0],
      tripDetails: {
        date,
        time,
        numTravelers,
        pickupLocation,
        dropoffLocation,
        notes
      },
      availableVehicles: vehicles
    }
  });
});

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  getTouristBookings,
  getDriverBookings,
  cancelBooking,
  getBookingStatistics,
  planTrip
};