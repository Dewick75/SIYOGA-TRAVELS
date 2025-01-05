// src/controllers/driverController.js
const { executeQuery } = require('../config/DB/db');
const bcrypt = require('bcryptjs');
const { catchAsync, ApiError } = require('../utils/errorHandler');
const logger = require('../config/logger');

/**
 * Get driver profile
 * @route GET /api/drivers/profile
 */
const getDriverProfile = catchAsync(async (req, res) => {
  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;
  
  if (!driverId) {
    throw new ApiError(403, 'Not authorized as driver');
  }
  
  const query = `
    SELECT 
      D.DriverID, 
      D.Name, 
      D.PhoneNumber, 
      D.LicenseNumber,
      D.ProfilePicture,
      D.Status,
      D.Rating,
      D.TotalTrips,
      D.ReviewCount,
      D.Biography,
      D.ExperienceYears,
      U.Email,
      U.LastLoginAt
    FROM Drivers D
    JOIN Users U ON D.UserID = U.UserID
    WHERE D.DriverID = @driverId
  `;
  
  const result = await executeQuery(query, { driverId });
  
  if (!result.recordset || result.recordset.length === 0) {
    throw new ApiError(404, 'Driver profile not found');
  }
  
  const profile = result.recordset[0];
  
  // Get driver's vehicles
  const vehiclesQuery = `
    SELECT 
      VehicleID, 
      Type, 
      Make, 
      Model, 
      Year, 
      Capacity, 
      Status
    FROM Vehicles
    WHERE DriverID = @driverId
  `;
  
  const vehiclesResult = await executeQuery(vehiclesQuery, { driverId });
  
  // Add vehicles to profile response
  profile.Vehicles = vehiclesResult.recordset;
  
  res.json({
    success: true,
    data: profile
  });
});

/**
 * Update driver profile
 * @route PUT /api/drivers/profile
 */
const updateDriverProfile = catchAsync(async (req, res) => {
  const { 
    name, 
    phoneNumber, 
    biography, 
    experienceYears, 
    profilePicture 
  } = req.body;
  
  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;
  
  if (!driverId) {
    throw new ApiError(403, 'Not authorized as driver');
  }
  
  // Build update query
  let updateQuery = 'UPDATE Drivers SET ';
  const params = { driverId };
  const updates = [];
  
  if (name) {
    updates.push('Name = @name');
    params.name = name;
  }
  
  if (phoneNumber !== undefined) {
    updates.push('PhoneNumber = @phoneNumber');
    params.phoneNumber = phoneNumber;
  }
  
  if (biography !== undefined) {
    updates.push('Biography = @biography');
    params.biography = biography;
  }
  
  if (experienceYears !== undefined) {
    updates.push('ExperienceYears = @experienceYears');
    params.experienceYears = experienceYears;
  }
  
  if (profilePicture !== undefined) {
    updates.push('ProfilePicture = @profilePicture');
    params.profilePicture = profilePicture;
  }
  
  if (updates.length === 0) {
    throw new ApiError(400, 'No updates provided');
  }
  
  updateQuery += updates.join(', ');
  updateQuery += ', UpdatedAt = GETDATE() WHERE DriverID = @driverId';
  
  await executeQuery(updateQuery, params);
  
  // Get updated profile
  const updatedProfile = await executeQuery(`
    SELECT 
      D.DriverID, 
      D.Name, 
      D.PhoneNumber, 
      D.LicenseNumber,
      D.ProfilePicture,
      D.Status,
      D.Rating,
      D.Biography,
      D.ExperienceYears,
      U.Email
    FROM Drivers D
    JOIN Users U ON D.UserID = U.UserID
    WHERE D.DriverID = @driverId
  `, { driverId });
  
  const profile = updatedProfile.recordset[0];
  
  logger.info(`Driver profile updated: ${driverId}`);
  
  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: profile
  });
});

/**
 * Change driver password
 * @route PUT /api/drivers/change-password
 */
const changeDriverPassword = catchAsync(async (req, res) => {
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
  
  logger.info(`Driver password changed: user ID ${userId}`);
  
  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Get driver trips (history)
 * @route GET /api/drivers/trips
 */
const getDriverTrips = catchAsync(async (req, res) => {
  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;
  
  if (!driverId) {
    throw new ApiError(403, 'Not authorized as driver');
  }
  
  const { status, vehicleId } = req.query;
  
  let query = `
    SELECT 
      B.BookingID, 
      B.TripDate, 
      B.TripTime,
      B.PickupLocation,
      B.DropoffLocation,
      B.Status AS BookingStatus,
      B.TotalAmount,
      B.CreatedAt,
      P.Status AS PaymentStatus,
      T.TouristID,
      T.Name AS TouristName,
      T.PhoneNumber AS TouristPhone,
      V.VehicleID,
      V.Make + ' ' + V.Model AS VehicleName,
      V.Type AS VehicleType,
      DS.Name AS DestinationName
    FROM Bookings B
    JOIN Tourists T ON B.TouristID = T.TouristID
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
    WHERE D.DriverID = @driverId
  `;
  
  const params = { driverId };
  
  // Add filters if provided
  if (status) {
    query += ` AND B.Status = @status`;
    params.status = status;
  }
  
  if (vehicleId) {
    query += ` AND V.VehicleID = @vehicleId`;
    params.vehicleId = vehicleId;
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
 * Get driver reviews
 * @route GET /api/drivers/reviews
 */
const getDriverReviews = catchAsync(async (req, res) => {
  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;
  
  if (!driverId) {
    throw new ApiError(403, 'Not authorized as driver');
  }
  
  const query = `
    SELECT 
      R.ReviewID,
      R.BookingID,
      R.Rating,
      R.Comment,
      R.CreatedAt,
      T.Name AS TouristName,
      V.Make + ' ' + V.Model AS VehicleName,
      V.Type AS VehicleType,
      B.TripDate
    FROM Reviews R
    JOIN Bookings B ON R.BookingID = B.BookingID
    JOIN Tourists T ON R.TouristID = T.TouristID
    JOIN Vehicles V ON R.VehicleID = V.VehicleID
    WHERE R.DriverID = @driverId
    ORDER BY R.CreatedAt DESC
  `;
  
  const result = await executeQuery(query, { driverId });
  
  res.json({
    success: true,
    count: result.recordset.length,
    data: result.recordset
  });
});

/**
 * Get driver earnings
 * @route GET /api/drivers/earnings
 */
const getDriverEarnings = catchAsync(async (req, res) => {
  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;
  
  if (!driverId) {
    throw new ApiError(403, 'Not authorized as driver');
  }
  
  const { period, startDate, endDate } = req.query;
  
  // Base query for total earnings
  let totalQuery = `
    SELECT SUM(B.TotalAmount) AS TotalEarnings
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    WHERE V.DriverID = @driverId
      AND B.Status = 'Completed'
      AND EXISTS (SELECT 1 FROM Payments P WHERE P.BookingID = B.BookingID AND P.Status = 'Completed')
  `;
  
  // Base query for periodic earnings
  let periodicQuery = `
    SELECT 
  `;
  
  // Define time period grouping
  if (period === 'daily') {
    periodicQuery += `
      CAST(B.TripDate AS DATE) AS Period,
      COUNT(*) AS TripCount,
      SUM(B.TotalAmount) AS Earnings
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    WHERE V.DriverID = @driverId
      AND B.Status = 'Completed'
      AND EXISTS (SELECT 1 FROM Payments P WHERE P.BookingID = B.BookingID AND P.Status = 'Completed')
      AND B.TripDate BETWEEN DATEADD(DAY, -30, GETDATE()) AND GETDATE()
    GROUP BY CAST(B.TripDate AS DATE)
    ORDER BY CAST(B.TripDate AS DATE) DESC
    `;
  } else if (period === 'weekly') {
    periodicQuery += `
      DATEPART(YEAR, B.TripDate) AS Year,
      DATEPART(WEEK, B.TripDate) AS Week,
      COUNT(*) AS TripCount,
      SUM(B.TotalAmount) AS Earnings
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    WHERE V.DriverID = @driverId
      AND B.Status = 'Completed'
      AND EXISTS (SELECT 1 FROM Payments P WHERE P.BookingID = B.BookingID AND P.Status = 'Completed')
      AND B.TripDate BETWEEN DATEADD(WEEK, -12, GETDATE()) AND GETDATE()
    GROUP BY DATEPART(YEAR, B.TripDate), DATEPART(WEEK, B.TripDate)
    ORDER BY DATEPART(YEAR, B.TripDate) DESC, DATEPART(WEEK, B.TripDate) DESC
    `;
  } else { // monthly (default)
    periodicQuery += `
      DATEPART(YEAR, B.TripDate) AS Year,
      DATEPART(MONTH, B.TripDate) AS Month,
      COUNT(*) AS TripCount,
      SUM(B.TotalAmount) AS Earnings
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    WHERE V.DriverID = @driverId
      AND B.Status = 'Completed'
      AND EXISTS (SELECT 1 FROM Payments P WHERE P.BookingID = B.BookingID AND P.Status = 'Completed')
      AND B.TripDate BETWEEN DATEADD(MONTH, -12, GETDATE()) AND GETDATE()
    GROUP BY DATEPART(YEAR, B.TripDate), DATEPART(MONTH, B.TripDate)
    ORDER BY DATEPART(YEAR, B.TripDate) DESC, DATEPART(MONTH, B.TripDate) DESC
    `;
  }
  
  // Custom date range filter
  if (startDate && endDate) {
    totalQuery += ` AND B.TripDate BETWEEN @startDate AND @endDate`;
    
    // Override periodic query with custom date range
    periodicQuery = `
      SELECT 
      ${period === 'daily' 
        ? 'CAST(B.TripDate AS DATE) AS Period,'
        : period === 'weekly'
          ? 'DATEPART(YEAR, B.TripDate) AS Year, DATEPART(WEEK, B.TripDate) AS Week,'
          : 'DATEPART(YEAR, B.TripDate) AS Year, DATEPART(MONTH, B.TripDate) AS Month,'
      }
      COUNT(*) AS TripCount,
      SUM(B.TotalAmount) AS Earnings
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    WHERE V.DriverID = @driverId
      AND B.Status = 'Completed'
      AND EXISTS (SELECT 1 FROM Payments P WHERE P.BookingID = B.BookingID AND P.Status = 'Completed')
      AND B.TripDate BETWEEN @startDate AND @endDate
    GROUP BY ${period === 'daily' 
      ? 'CAST(B.TripDate AS DATE)'
      : period === 'weekly'
        ? 'DATEPART(YEAR, B.TripDate), DATEPART(WEEK, B.TripDate)'
        : 'DATEPART(YEAR, B.TripDate), DATEPART(MONTH, B.TripDate)'
    }
    ORDER BY ${period === 'daily' 
      ? 'CAST(B.TripDate AS DATE) DESC'
      : period === 'weekly'
        ? 'DATEPART(YEAR, B.TripDate) DESC, DATEPART(WEEK, B.TripDate) DESC'
        : 'DATEPART(YEAR, B.TripDate) DESC, DATEPART(MONTH, B.TripDate) DESC'
    }
    `;
  }
  
  const params = { 
    driverId,
    startDate: startDate || null,
    endDate: endDate || null
  };
  
  // Execute queries
  const totalResult = await executeQuery(totalQuery, params);
  const periodicResult = await executeQuery(periodicQuery, params);
  
  // Vehicle earnings breakdown
  const vehicleQuery = `
    SELECT 
      V.VehicleID,
      V.Make + ' ' + V.Model AS VehicleName,
      V.Type AS VehicleType,
      COUNT(*) AS TripCount,
      SUM(B.TotalAmount) AS Earnings
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    WHERE V.DriverID = @driverId
      AND B.Status = 'Completed'
      AND EXISTS (SELECT 1 FROM Payments P WHERE P.BookingID = B.BookingID AND P.Status = 'Completed')
      ${(startDate && endDate) ? 'AND B.TripDate BETWEEN @startDate AND @endDate' : ''}
    GROUP BY V.VehicleID, V.Make, V.Model, V.Type
    ORDER BY Earnings DESC
  `;
  
  const vehicleResult = await executeQuery(vehicleQuery, params);
  
  res.json({
    success: true,
    data: {
      totalEarnings: totalResult.recordset[0]?.TotalEarnings || 0,
      periodicEarnings: periodicResult.recordset,
      vehicleEarnings: vehicleResult.recordset
    }
  });
});

/**
 * Get driver dashboard data
 * @route GET /api/drivers/dashboard
 */
const getDriverDashboard = catchAsync(async (req, res) => {
  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;
  
  if (!driverId) {
    throw new ApiError(403, 'Not authorized as driver');
  }
  
  // Upcoming trips
  const upcomingTripsQuery = `
    SELECT 
      B.BookingID, 
      B.TripDate, 
      B.TripTime,
      B.PickupLocation,
      B.Status,
      B.TotalAmount,
      T.Name AS TouristName,
      T.PhoneNumber AS TouristPhone,
      V.Make + ' ' + V.Model AS VehicleName,
      DS.Name AS DestinationName
    FROM Bookings B
    JOIN Tourists T ON B.TouristID = T.TouristID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
    WHERE V.DriverID = @driverId AND B.Status IN ('Confirmed', 'Pending')
      AND B.TripDate >= CAST(GETDATE() AS Date)
    ORDER BY B.TripDate ASC, B.TripTime ASC
    OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
  `;
  
  const upcomingTripsResult = await executeQuery(upcomingTripsQuery, { driverId });
  
  // Recent bookings
  const recentBookingsQuery = `
    SELECT 
      B.BookingID, 
      B.TripDate, 
      B.Status,
      B.TotalAmount,
      P.Status AS PaymentStatus,
      T.Name AS TouristName,
      DS.Name AS DestinationName
    FROM Bookings B
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    JOIN Tourists T ON B.TouristID = T.TouristID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
    WHERE V.DriverID = @driverId
    ORDER BY B.CreatedAt DESC
    OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
  `;
  
  const recentBookingsResult = await executeQuery(recentBookingsQuery, { driverId });
  
  // Booking statistics
  const statisticsQuery = `
    SELECT
      COUNT(CASE WHEN B.Status = 'Completed' THEN 1 END) AS CompletedTrips,
      COUNT(CASE WHEN B.Status = 'Cancelled' THEN 1 END) AS CancelledTrips,
      COUNT(CASE WHEN B.Status = 'Confirmed' AND B.TripDate >= CAST(GETDATE() AS Date) THEN 1 END) AS UpcomingTrips,
      COUNT(*) AS TotalTrips,
      SUM(CASE WHEN B.Status = 'Completed' THEN B.TotalAmount ELSE 0 END) AS TotalEarnings
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    WHERE V.DriverID = @driverId
  `;
  
  const statisticsResult = await executeQuery(statisticsQuery, { driverId });
  
  // Recent reviews
  const reviewsQuery = `
    SELECT 
      R.ReviewID,
      R.Rating,
      R.Comment,
      R.CreatedAt,
      T.Name AS TouristName,
      B.TripDate,
      V.Make + ' ' + V.Model AS VehicleName
    FROM Reviews R
    JOIN Bookings B ON R.BookingID = B.BookingID
    JOIN Tourists T ON R.TouristID = T.TouristID
    JOIN Vehicles V ON R.VehicleID = V.VehicleID
    WHERE R.DriverID = @driverId
    ORDER BY R.CreatedAt DESC
    OFFSET 0 ROWS FETCH NEXT 3 ROWS ONLY
  `;
  
  const reviewsResult = await executeQuery(reviewsQuery, { driverId });
  
  // Driver vehicles
  const vehiclesQuery = `
    SELECT 
      VehicleID, 
      Type, 
      Make, 
      Model, 
      Status
    FROM Vehicles
    WHERE DriverID = @driverId
  `;
  
  const vehiclesResult = await executeQuery(vehiclesQuery, { driverId });
  
  res.json({
    success: true,
    data: {
      upcomingTrips: upcomingTripsResult.recordset,
      recentBookings: recentBookingsResult.recordset,
      statistics: statisticsResult.recordset[0] || {
        CompletedTrips: 0,
        CancelledTrips: 0,
        UpcomingTrips: 0,
        TotalTrips: 0,
        TotalEarnings: 0
      },
      recentReviews: reviewsResult.recordset,
      vehicles: vehiclesResult.recordset
    }
  });
});

/**
 * Update driver availability
 * @route PUT /api/drivers/availability
 */
const updateDriverAvailability = catchAsync(async (req, res) => {
  const { isAvailable, unavailableDates } = req.body;
  
  // Get driver ID from authenticated user
  const driverId = req.user.RoleID;
  
  if (!driverId) {
    throw new ApiError(403, 'Not authorized as driver');
  }
  
  // Update driver availability status
  const updateQuery = `
    UPDATE Drivers
    SET 
      IsAvailable = @isAvailable,
      UpdatedAt = GETDATE()
    WHERE DriverID = @driverId
  `;
  
  await executeQuery(updateQuery, { 
    driverId,
    isAvailable: isAvailable !== undefined ? isAvailable : true
  });
  
  // If unavailable dates are provided, update them
  if (unavailableDates && Array.isArray(unavailableDates)) {
    // First, remove existing dates
    await executeQuery(`
      DELETE FROM DriverUnavailableDates
      WHERE DriverID = @driverId
    `, { driverId });
    
    // Then insert new dates
    for (const date of unavailableDates) {
      await executeQuery(`
        INSERT INTO DriverUnavailableDates (DriverID, UnavailableDate)
        VALUES (@driverId, @date)
      `, { 
        driverId,
        date
      });
    }
  }
  
  logger.info(`Driver availability updated: ${driverId}`);
  
  res.json({
    success: true,
    message: 'Availability updated successfully'
  });
});

module.exports = {
  getDriverProfile,
  updateDriverProfile,
  changeDriverPassword,
  getDriverTrips,
  getDriverReviews,
  getDriverEarnings,
  getDriverDashboard,
  updateDriverAvailability
};