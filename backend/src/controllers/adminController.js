// src/controllers/adminController.js
const { executeQuery } = require('../config/DB/db');
const bcrypt = require('bcryptjs');
const { catchAsync, ApiError } = require('../utils/errorHandler');
const { sendEmail } = require('../services/emailService');
const logger = require('../config/logger');

/**
 * Get admin dashboard statistics
 * @route GET /api/admin/dashboard
 */
const getDashboardStats = catchAsync(async (req, res) => {
  try {
    // Only admin can access this endpoint
    if (req.user.Role !== 'admin') {
      throw new ApiError(403, 'Not authorized as admin');
    }

    // Total Users - Updated for TripBookingSystem schema
    const usersQuery = `
      SELECT
        (SELECT COUNT(*) FROM Tourists) AS TouristCount,
        (SELECT COUNT(*) FROM Drivers) AS DriverCount,
        (SELECT COUNT(*) FROM Users) AS TotalUserCount
    `;

    const usersResult = await executeQuery(usersQuery);
    logger.info('Users query executed successfully');

    // Booking Statistics - Updated for TripBookingSystem schema
    const bookingsQuery = `
      SELECT
        (SELECT COUNT(*) FROM Bookings WHERE status = 'pending') AS PendingBookings,
        (SELECT COUNT(*) FROM Bookings WHERE status = 'confirmed') AS ConfirmedBookings,
        (SELECT COUNT(*) FROM Bookings WHERE status = 'completed') AS CompletedBookings,
        (SELECT COUNT(*) FROM Bookings WHERE status = 'rejected') AS CancelledBookings,
        (SELECT COUNT(*) FROM Bookings) AS TotalBookings,
        ISNULL((SELECT SUM(fare) FROM Bookings WHERE payment_status = 'paid'), 0) AS TotalRevenue
    `;

    const bookingsResult = await executeQuery(bookingsQuery);
    logger.info('Bookings query executed successfully');

    // Recent Bookings - Updated for TripBookingSystem schema
    const recentBookingsQuery = `
      SELECT TOP 5
        B.booking_id AS BookingID,
        T.start_date AS TripDate,
        '' AS TripTime,
        B.status AS Status,
        B.fare AS TotalAmount,
        U_traveler.full_name AS TouristName,
        U_driver.full_name AS DriverName,
        V.make_model AS VehicleName,
        B.payment_status AS PaymentStatus,
        D.name AS DestinationName
      FROM Bookings B
      JOIN Trips T ON B.trip_id = T.trip_id
      JOIN Users U_traveler ON T.traveler_id = U_traveler.user_id
      JOIN Users U_driver ON B.driver_id = U_driver.user_id
      JOIN Vehicles V ON B.vehicle_id = V.vehicle_id
      LEFT JOIN TripStops TS ON T.trip_id = TS.trip_id
      LEFT JOIN Destinations D ON TS.destination_id = D.destination_id
      ORDER BY B.booking_id DESC
    `;

    let recentBookingsResult;
    try {
      recentBookingsResult = await executeQuery(recentBookingsQuery);
      logger.info('Recent bookings query executed successfully');
    } catch (error) {
      logger.error('Error fetching recent bookings:', error.message);
      // Provide empty result if query fails
      recentBookingsResult = { recordset: [] };
    }

    // Pending Driver Approvals - Updated for TripBookingSystem schema
    const pendingDriversQuery = `
      SELECT
        D.driver_id AS DriverID,
        D.full_name AS Name,
        D.phone_number AS PhoneNumber,
        D.license_number AS LicenseNumber,
        U.email AS Email
      FROM Drivers D
      JOIN Users U ON D.user_id = U.user_id
      WHERE D.status = 'Pending'
      ORDER BY D.driver_id DESC
    `;

    const pendingDriversResult = await executeQuery(pendingDriversQuery);
    logger.info('Pending drivers query executed successfully');

    // Monthly Revenue Trend (last 6 months) - Updated for TripBookingSystem schema
    const revenueTrendQuery = `
      SELECT
        DATEPART(YEAR, T.start_date) AS Year,
        DATEPART(MONTH, T.start_date) AS Month,
        ISNULL(SUM(B.fare), 0) AS Revenue,
        COUNT(*) AS BookingCount
      FROM Bookings B
      JOIN Trips T ON B.trip_id = T.trip_id
      WHERE B.status IN ('confirmed', 'completed')
        AND T.start_date >= DATEADD(MONTH, -6, GETDATE())
      GROUP BY DATEPART(YEAR, T.start_date), DATEPART(MONTH, T.start_date)
      ORDER BY Year, Month
    `;

    let revenueTrendResult;
    try {
      revenueTrendResult = await executeQuery(revenueTrendQuery);
      logger.info('Revenue trend query executed successfully');
    } catch (error) {
      logger.error('Error fetching revenue trend:', error.message);
      // Provide empty result if query fails
      revenueTrendResult = { recordset: [] };
    }

    // Top Destinations - Updated for TripBookingSystem schema
    const topDestinationsQuery = `
      SELECT TOP 5
        D.destination_id AS DestinationID,
        D.name AS Name,
        D.region AS Location,
        '' AS ImageURL,
        'Active' AS Status,
        COUNT(TS.stop_id) AS BookingCount,
        ISNULL(SUM(B.fare), 0) AS Revenue
      FROM Destinations D
      LEFT JOIN TripStops TS ON D.destination_id = TS.destination_id
      LEFT JOIN Trips T ON TS.trip_id = T.trip_id
      LEFT JOIN Bookings B ON T.trip_id = B.trip_id
      GROUP BY D.destination_id, D.name, D.region
      ORDER BY BookingCount DESC
    `;

    let topDestinationsResult;
    try {
      topDestinationsResult = await executeQuery(topDestinationsQuery);
      logger.info('Top destinations query executed successfully');
    } catch (error) {
      logger.error('Error fetching top destinations:', error.message);
      // Provide empty result if query fails
      topDestinationsResult = { recordset: [] };
    }

    // Top Drivers - Updated for TripBookingSystem schema
    const topDriversQuery = `
      SELECT TOP 5
        D.driver_id AS DriverID,
        D.full_name AS Name,
        0 AS Rating,
        0 AS TotalTrips,
        COUNT(B.booking_id) AS TripCount,
        ISNULL(SUM(B.fare), 0) AS Revenue
      FROM Drivers D
      LEFT JOIN Vehicles V ON D.driver_id = V.driver_id
      LEFT JOIN Bookings B ON V.vehicle_id = B.vehicle_id
      GROUP BY D.driver_id, D.full_name
      ORDER BY TripCount DESC
    `;

    let topDriversResult;
    try {
      topDriversResult = await executeQuery(topDriversQuery);
      logger.info('Top drivers query executed successfully');
    } catch (error) {
      logger.error('Error fetching top drivers:', error.message);
      // Provide empty result if query fails
      topDriversResult = { recordset: [] };
    }

    res.json({
      success: true,
      data: {
        users: usersResult.recordset[0],
        bookingStats: bookingsResult.recordset[0],
        recentBookings: recentBookingsResult.recordset,
        pendingDrivers: pendingDriversResult.recordset,
        revenueTrend: revenueTrendResult.recordset,
        topDestinations: topDestinationsResult.recordset,
        topDrivers: topDriversResult.recordset
      }
    });
  } catch (error) {
    logger.error('Error in getDashboardStats:', error);
    throw new ApiError(500, `Failed to fetch dashboard data: ${error.message}`);
  }
});

/**
 * Get all drivers (admin only)
 * @route GET /api/admin/drivers
 */
const getAllDrivers = catchAsync(async (req, res) => {
  // Only admin can access this endpoint
  if (req.user.Role !== 'admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }

  const { status, search } = req.query;

  let query = `
    SELECT
      D.driver_id AS DriverID,
      D.full_name AS Name,
      D.phone_number AS PhoneNumber,
      D.license_number AS LicenseNumber,
      D.status AS Status,
      0 AS Rating,
      0 AS TotalTrips,
      U.email AS Email,
      U.created_at AS CreatedAt,
      (SELECT COUNT(*) FROM Vehicles WHERE driver_id = D.driver_id) AS VehicleCount,
      CASE
        WHEN EV.is_verified = 1 THEN 1
        ELSE 0
      END AS IsEmailVerified,
      D.profile_picture AS ProfilePicture
    FROM Drivers D
    JOIN Users U ON D.user_id = U.user_id
    LEFT JOIN EmailVerification EV ON U.user_id = EV.user_id
  `;

  const params = {};
  const conditions = [];

  // Add filters if provided
  if (status) {
    conditions.push('D.status = @status');
    params.status = status;
  }

  if (search) {
    conditions.push('(D.full_name LIKE @search OR D.phone_number LIKE @search OR D.license_number LIKE @search OR U.email LIKE @search)');
    params.search = `%${search}%`;
  }

  // Add WHERE clause if any conditions
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  // Order by ID (newest first)
  query += ' ORDER BY D.driver_id DESC';

  try {
    const result = await executeQuery(query, params);
    logger.info(`Retrieved ${result.recordset.length} drivers`);

    res.json({
      success: true,
      count: result.recordset.length,
      data: result.recordset
    });
  } catch (error) {
    logger.error(`Error retrieving drivers: ${error.message}`);
    throw new ApiError(500, `Failed to retrieve drivers: ${error.message}`);
  }
});

/**
 * Get driver details by ID (admin only)
 * @route GET /api/admin/drivers/:id
 */
const getDriverById = catchAsync(async (req, res) => {
  // Only admin can access this endpoint
  if (req.user.Role !== 'admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }

  const { id } = req.params;

  // Get driver details - Updated for TripBookingSystem schema
  const driverQuery = `
    SELECT
      D.driver_id AS DriverID,
      D.full_name AS Name,
      D.phone_number AS PhoneNumber,
      D.license_number AS LicenseNumber,
      D.status AS Status,
      0 AS Rating,
      0 AS TotalTrips,
      D.registration_date AS JoinDate,
      U.email AS Email,
      U.created_at AS CreatedAt,
      U.user_id AS UserID,
      CASE
        WHEN EV.is_verified = 1 THEN 1
        ELSE 0
      END AS IsEmailVerified,
      D.profile_picture AS ProfilePicture,
      D.nic_number AS NICNumber,
      D.nic_front_image AS NICFrontImage,
      D.nic_back_image AS NICBackImage,
      D.license_front_image AS LicenseFrontImage,
      D.license_expiry_date AS LicenseExpiryDate,
      D.police_clearance_image AS PoliceClearanceImage
    FROM Drivers D
    JOIN Users U ON D.user_id = U.user_id
    LEFT JOIN EmailVerification EV ON U.user_id = EV.user_id
    WHERE D.driver_id = @id
  `;

  try {
    const driverResult = await executeQuery(driverQuery, { id });

    if (!driverResult.recordset || driverResult.recordset.length === 0) {
      throw new ApiError(404, 'Driver not found');
    }

    const driver = driverResult.recordset[0];

    // Get driver's vehicles - Updated for TripBookingSystem schema
    const vehiclesQuery = `
      SELECT
        vehicle_id AS VehicleID,
        vehicle_type AS Type,
        make_model AS Make,
        '' AS Model,
        0 AS Year,
        registration_number AS LicensePlate,
        seat_count AS Capacity,
        0 AS PricePerDay,
        CASE WHEN verified = 1 THEN 'Active' ELSE 'Inactive' END AS Status,
        vehicle_photo AS VehiclePhoto,
        air_conditioned AS HasAC
      FROM Vehicles
      WHERE driver_id = @id
    `;

    let vehiclesResult;
    try {
      vehiclesResult = await executeQuery(vehiclesQuery, { id });
      logger.info(`Retrieved ${vehiclesResult.recordset.length} vehicles for driver ${id}`);
    } catch (error) {
      logger.error(`Error retrieving vehicles for driver ${id}: ${error.message}`);
      vehiclesResult = { recordset: [] };
    }

    // Get driver's recent bookings - Updated for TripBookingSystem schema
    const bookingsQuery = `
      SELECT TOP 5
        B.booking_id AS BookingID,
        T.start_date AS TripDate,
        B.status AS Status,
        B.fare AS TotalAmount,
        U_traveler.full_name AS TouristName,
        B.payment_status AS PaymentStatus
      FROM Bookings B
      JOIN Trips T ON B.trip_id = T.trip_id
      JOIN Users U_traveler ON T.traveler_id = U_traveler.user_id
      JOIN Vehicles V ON B.vehicle_id = V.vehicle_id
      WHERE V.driver_id = @id
      ORDER BY B.created_at DESC
    `;

    let bookingsResult;
    try {
      bookingsResult = await executeQuery(bookingsQuery, { id });
      logger.info(`Retrieved ${bookingsResult.recordset.length} bookings for driver ${id}`);
    } catch (error) {
      logger.error(`Error retrieving bookings for driver ${id}: ${error.message}`);
      bookingsResult = { recordset: [] };
    }

    // Get driver's recent reviews - Updated for TripBookingSystem schema
    const reviewsQuery = `
      SELECT TOP 5
        R.review_id AS ReviewID,
        R.rating AS Rating,
        R.review_text AS Comment,
        R.created_at AS CreatedAt,
        U_traveler.full_name AS TouristName
      FROM TripReviews R
      JOIN Users U_traveler ON R.traveler_id = U_traveler.user_id
      WHERE R.driver_id = @id
      ORDER BY R.created_at DESC
    `;

    let reviewsResult;
    try {
      reviewsResult = await executeQuery(reviewsQuery, { id });
      logger.info(`Retrieved ${reviewsResult.recordset.length} reviews for driver ${id}`);
    } catch (error) {
      logger.error(`Error retrieving reviews for driver ${id}: ${error.message}`);
      reviewsResult = { recordset: [] };
    }

    // Add relations to driver object
    driver.Vehicles = vehiclesResult.recordset;
    driver.RecentBookings = bookingsResult.recordset;
    driver.RecentReviews = reviewsResult.recordset;

    res.json({
      success: true,
      data: driver
    });
  } catch (error) {
    logger.error(`Error retrieving driver details: ${error.message}`);
    throw error;
  }
});

/**
 * Update driver status (approve/reject/suspend)
 * @route PATCH /api/admin/drivers/:id/status
 */
const updateDriverStatus = catchAsync(async (req, res) => {
  try {
    // Only admin can access this endpoint
    if (req.user.Role !== 'admin') {
      throw new ApiError(403, 'Not authorized as admin');
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    logger.info(`Attempting to update driver status: ID=${id}, NewStatus=${status}`);

    // Validate status
    const validStatuses = ['Active', 'Pending', 'Suspended', 'Rejected', 'Approved', 'Blocked'];
    if (!status || !validStatuses.includes(status)) {
      throw new ApiError(400, 'Invalid status');
    }

    // Get driver details - Updated for TripBookingSystem schema
    const driverQuery = `
      SELECT D.status AS CurrentStatus, U.email AS Email, D.full_name AS Name
      FROM Drivers D
      JOIN Users U ON D.user_id = U.user_id
      WHERE D.driver_id = @id
    `;

    logger.debug(`Executing driver query for ID: ${id}`);
    const driverResult = await executeQuery(driverQuery, { id });

    if (!driverResult.recordset || driverResult.recordset.length === 0) {
      logger.warn(`Driver not found with ID: ${id}`);
      throw new ApiError(404, 'Driver not found');
    }

    const driver = driverResult.recordset[0];
    logger.info(`Found driver: ${driver.Name}, Current status: ${driver.CurrentStatus}`);

    // Update driver status - Updated for TripBookingSystem schema
    const updateQuery = `
      UPDATE Drivers
      SET
        status = @status,
        updated_at = GETDATE()
      WHERE driver_id = @id
    `;

    logger.debug(`Executing update query: ${updateQuery}`);
    await executeQuery(updateQuery, {
      id,
      status
    });

    // Send notification email to driver
    let emailSubject = '';
    let emailText = '';

    if ((status === 'Active' || status === 'Approved') && driver.CurrentStatus === 'Pending') {
      emailSubject = 'Driver Registration Approved - Siyoga Travels';
      emailText = `Dear ${driver.Name},\n\nCongratulations! Your driver registration has been approved. You can now log in to your account and start accepting trip requests.\n\nThank you for joining Siyoga Travels.`;
    } else if (status === 'Rejected') {
      emailSubject = 'Driver Registration Rejected - Siyoga Travels';
      emailText = `Dear ${driver.Name},\n\nWe regret to inform you that your driver registration has been rejected.\n\nReason: ${reason || 'No specific reason provided'}\n\nIf you believe this is an error, please contact our support team.`;
    } else if (status === 'Suspended' || status === 'Blocked') {
      emailSubject = 'Driver Account Suspended - Siyoga Travels';
      emailText = `Dear ${driver.Name},\n\nYour driver account has been suspended.\n\nReason: ${reason || 'No specific reason provided'}\n\nIf you believe this is an error, please contact our support team.`;
    } else if ((status === 'Active' || status === 'Approved') && (driver.CurrentStatus === 'Suspended' || driver.CurrentStatus === 'Blocked')) {
      emailSubject = 'Driver Account Reactivated - Siyoga Travels';
      emailText = `Dear ${driver.Name},\n\nYour driver account has been reactivated. You can now log in to your account and start accepting trip requests again.\n\nThank you for your patience.`;
    }

    if (emailSubject && emailText) {
      try {
        await sendEmail({
          to: driver.Email,
          subject: emailSubject,
          text: emailText
        });
        logger.info(`Notification email sent to driver: ${driver.Email}`);
      } catch (emailError) {
        // Don't fail the status update if email sending fails
        logger.error(`Failed to send notification email: ${emailError.message}`);
      }
    }

    logger.info(`Driver status successfully updated: ${id} -> ${status}`);

    res.json({
      success: true,
      message: `Driver status updated to ${status}`,
      data: {
        driverId: id,
        status
      }
    });
  } catch (error) {
    logger.error(`Error in updateDriverStatus: ${error.message}`);
    throw error;
  }
});

/**
 * Get all tourists (admin only)
 * @route GET /api/admin/tourists
 */
const getAllTourists = catchAsync(async (req, res) => {
  // Only admin can access this endpoint
  if (req.user.Role !== 'Admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }

  const { search } = req.query;

  let query = `
    SELECT
      T.TouristID,
      T.Name,
      T.PhoneNumber,
      T.Country,
      T.RegistrationDate,
      T.Status,
      U.Email,
      U.LastLoginAt,
      (SELECT COUNT(*) FROM Bookings WHERE TouristID = T.TouristID) AS BookingCount
    FROM Tourists T
    JOIN Users U ON T.UserID = U.UserID
  `;

  const params = {};

  // Add search filter if provided
  if (search) {
    query += ` WHERE T.Name LIKE @search OR T.PhoneNumber LIKE @search OR U.Email LIKE @search OR T.Country LIKE @search`;
    params.search = `%${search}%`;
  }

  // Order by registration date (newest first)
  query += ' ORDER BY T.RegistrationDate DESC';

  const result = await executeQuery(query, params);

  res.json({
    success: true,
    count: result.recordset.length,
    data: result.recordset
  });
});

/**
 * Get tourist details by ID (admin only)
 * @route GET /api/admin/tourists/:id
 */
const getTouristById = catchAsync(async (req, res) => {
  // Only admin can access this endpoint
  if (req.user.Role !== 'Admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }

  const { id } = req.params;

  // Get tourist details
  const touristQuery = `
    SELECT
      T.TouristID,
      T.Name,
      T.PhoneNumber,
      T.Country,
      T.ProfilePicture,
      T.PreferredLanguage,
      T.RegistrationDate,
      T.Status,
      T.DateOfBirth,
      T.Gender,
      T.EmergencyContactName,
      T.EmergencyContactPhone,
      T.TravelPreferences,
      T.UpdatedAt,
      U.Email,
      U.LastLoginAt,
      U.CreatedAt
    FROM Tourists T
    JOIN Users U ON T.UserID = U.UserID
    WHERE T.TouristID = @id
  `;

  const touristResult = await executeQuery(touristQuery, { id });

  if (!touristResult.recordset || touristResult.recordset.length === 0) {
    throw new ApiError(404, 'Tourist not found');
  }

  const tourist = touristResult.recordset[0];

  // Get tourist's recent bookings
  const bookingsQuery = `
    SELECT
      B.BookingID,
      B.TripDate,
      B.Status,
      0 AS TotalAmount,
      D.Name AS DriverName,
      V.Make + ' ' + V.Model AS VehicleName,
      P.Status AS PaymentStatus
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    WHERE B.TouristID = @id
    ORDER BY B.CreatedAt DESC
    OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY
  `;

  const bookingsResult = await executeQuery(bookingsQuery, { id });

  // Get booking statistics
  const statsQuery = `
    SELECT
      COUNT(CASE WHEN Status = 'Completed' THEN 1 END) AS CompletedBookings,
      COUNT(CASE WHEN Status = 'Cancelled' THEN 1 END) AS CancelledBookings,
      COUNT(*) AS TotalBookings,
      0 AS TotalSpent
    FROM Bookings
    WHERE TouristID = @id
  `;

  const statsResult = await executeQuery(statsQuery, { id });

  // Add relations to tourist object
  tourist.RecentBookings = bookingsResult.recordset;
  tourist.Statistics = statsResult.recordset[0] || {
    CompletedBookings: 0,
    CancelledBookings: 0,
    TotalBookings: 0,
    TotalSpent: 0
  };

  res.json({
    success: true,
    data: tourist
  });
});

/**
 * Generate reports (admin only)
 * @route GET /api/admin/reports
 */
const generateReport = catchAsync(async (req, res) => {
  // Only admin can access this endpoint
  if (req.user.Role !== 'Admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }

  const { reportType, startDate, endDate } = req.query;

  if (!reportType) {
    throw new ApiError(400, 'Report type is required');
  }

  const dateRange = startDate && endDate
    ? ` AND B.TripDate BETWEEN @startDate AND @endDate`
    : '';

  const params = {
    startDate: startDate || null,
    endDate: endDate || null
  };

  let reportData;
  let reportTitle;

  switch (reportType) {
    case 'revenue':
      reportTitle = 'Revenue Report';

      // Revenue by day
      const revenueQuery = `
        SELECT
          CAST(B.TripDate AS DATE) AS Date,
          COUNT(*) AS BookingCount,
          0 AS Revenue
        FROM Bookings B
        WHERE B.Status IN ('Completed', 'Confirmed')
          ${dateRange}
        GROUP BY CAST(B.TripDate AS DATE)
        ORDER BY CAST(B.TripDate AS DATE)
      `;

      reportData = await executeQuery(revenueQuery, params);
      break;

    case 'bookings':
      reportTitle = 'Bookings Report';

      // Detailed bookings
      const bookingsQuery = `
        SELECT
          B.BookingID,
          B.TripDate,
          B.TripTime,
          B.Status,
          0 AS TotalAmount,
          B.CreatedAt,
          T.Name AS TouristName,
          T.PhoneNumber AS TouristPhone,
          D.Name AS DriverName,
          V.Make + ' ' + V.Model AS VehicleName,
          DS.Name AS DestinationName,
          P.Status AS PaymentStatus,
          P.Method AS PaymentMethod
        FROM Bookings B
        JOIN Tourists T ON B.TouristID = T.TouristID
        JOIN Vehicles V ON B.VehicleID = V.VehicleID
        JOIN Drivers D ON V.DriverID = D.DriverID
        LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
        LEFT JOIN Payments P ON B.BookingID = P.BookingID
        WHERE 1=1 ${dateRange}
        ORDER BY B.TripDate DESC, B.TripTime DESC
      `;

      reportData = await executeQuery(bookingsQuery, params);
      break;

    case 'drivers':
      reportTitle = 'Driver Performance Report';

      // Driver performance
      const driversQuery = `
        SELECT
          D.DriverID,
          D.Name,
          D.Rating,
          D.TotalTrips,
          COUNT(B.BookingID) AS TripCount,
          COUNT(CASE WHEN B.Status = 'Completed' THEN 1 END) AS CompletedTrips,
          COUNT(CASE WHEN B.Status = 'Cancelled' THEN 1 END) AS CancelledTrips,
          0 AS Revenue
        FROM Drivers D
        LEFT JOIN Vehicles V ON D.DriverID = V.DriverID
        LEFT JOIN Bookings B ON V.VehicleID = B.VehicleID
          AND (1=1 ${dateRange})
        GROUP BY D.DriverID, D.Name, D.Rating, D.TotalTrips
        ORDER BY TripCount DESC
      `;

      reportData = await executeQuery(driversQuery, params);
      break;

    case 'destinations':
      reportTitle = 'Destination Popularity Report';

      // Destination popularity
      const destinationsQuery = `
        SELECT
          D.DestinationID,
          D.Name,
          D.Location,
          COUNT(B.BookingID) AS BookingCount,
          0 AS Revenue
        FROM Destinations D
        LEFT JOIN Bookings B ON D.DestinationID = B.DestinationID
          AND (1=1 ${dateRange})
        GROUP BY D.DestinationID, D.Name, D.Location
        ORDER BY BookingCount DESC
      `;

      reportData = await executeQuery(destinationsQuery, params);
      break;

    default:
      throw new ApiError(400, 'Invalid report type');
  }

  // Create a report ID without saving to database (Reports table doesn't exist)
  const reportId = Date.now(); // Use timestamp as a unique ID

  res.json({
    success: true,
    data: {
      reportId,
      title: reportTitle,
      type: reportType,
      parameters: {
        startDate,
        endDate
      },
      generatedAt: new Date(),
      records: reportData.recordset
    }
  });
});

/**
 * Change admin password
 * @route PUT /api/admin/change-password
 */
const changeAdminPassword = catchAsync(async (req, res) => {
  // Only admin can access this endpoint
  if (req.user.Role !== 'Admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }

  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Current password and new password are required');
  }

  // Validate password strength
  if (newPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters long');
  }

  // Get user ID from authenticated user
  const userId = req.user.UserID;

  // Get current password hash
  const userQuery = `
    SELECT Password
    FROM Users
    WHERE UserID = @userId
  `;

  const userResult = await executeQuery(userQuery, { userId });

  if (!userResult.recordset || userResult.recordset.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  const user = userResult.recordset[0];

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.Password);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  // Update password
  await executeQuery(`
    UPDATE Users
    SET Password = @password, UpdatedAt = GETDATE()
    WHERE UserID = @userId
  `, {
    userId,
    password: hashedPassword
  });

  logger.info(`Admin password changed: user ID ${userId}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Create a new admin user
 * @route POST /api/admin/create
 */
const createAdmin = catchAsync(async (req, res) => {
  try {
    // Allow existing admins to create new admins, or allow creation if no admin exists
    let skipAuthCheck = false;

    // Check if any admin exists in the system
    const adminCheckQuery = `SELECT COUNT(*) AS AdminCount FROM Users WHERE role = 'admin'`;
    const adminCheckResult = await executeQuery(adminCheckQuery);

    if (adminCheckResult.recordset && adminCheckResult.recordset[0].AdminCount === 0) {
      // No admins exist, allow creation without auth check
      logger.info('No admins exist in the system, allowing admin creation without auth check');
      skipAuthCheck = true;
    }

    // If user is authenticated and we're not skipping the check
    if (req.user && !skipAuthCheck) {
      // Only admins can create other admins
      if (req.user.role !== 'admin') {
        throw new ApiError(403, 'Not authorized to create admin users');
      }
      logger.info(`Admin user ${req.user.email} is creating a new admin`);
    }

    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email, and password are required');
    }

    // Check if email already exists
    const checkQuery = `
      SELECT 1 FROM Users WHERE email = @email
    `;

    const checkResult = await executeQuery(checkQuery, { email });

    if (checkResult.recordset && checkResult.recordset.length > 0) {
      throw new ApiError(400, 'Email already in use');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create admin user based on the TripBookingSystem schema
    const result = await executeQuery(`
      INSERT INTO Users (full_name, email, password, role, created_at)
      VALUES (@name, @email, @password, 'admin', GETDATE());

      SELECT SCOPE_IDENTITY() AS user_id;
    `, {
      name,
      email,
      password: hashedPassword
    });

    if (!result.recordset || !result.recordset[0]) {
      throw new ApiError(500, 'Failed to create admin user');
    }

    const userId = result.recordset[0].user_id;
    logger.info(`New admin user created: ${email} with ID: ${userId}`);

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        userId: userId
      }
    });
  } catch (error) {
    logger.error('Error in createAdmin:', error);
    throw error;
  }
});

module.exports = {
  getDashboardStats,
  getAllDrivers,
  getDriverById,
  updateDriverStatus,
  getAllTourists,
  getTouristById,
  generateReport,
  changeAdminPassword,
  createAdmin
};