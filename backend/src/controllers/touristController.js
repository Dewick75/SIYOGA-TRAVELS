// src/controllers/touristController.js
const { executeQuery } = require('../config/DB/db');
const bcrypt = require('bcryptjs');
const { catchAsync, ApiError } = require('../utils/errorHandler');
const logger = require('../config/logger');

/**
 * Get tourist profile
 * @route GET /api/tourists/profile
 */
const getTouristProfile = catchAsync(async (req, res) => {
  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;

  if (!touristId) {
    throw new ApiError(403, 'Not authorized as tourist');
  }

  const query = `
    SELECT
      T.TouristID,
      T.Name,
      T.PhoneNumber,
      T.Country,
      T.ProfilePicture,
      T.PreferredLanguage,
      T.DateOfBirth,
      T.Gender,
      T.EmergencyContactName,
      T.EmergencyContactPhone,
      T.TravelPreferences,
      U.Email,
      U.LastLoginAt
    FROM Tourists T
    JOIN Users U ON T.UserID = U.UserID
    WHERE T.TouristID = @touristId
  `;

  const result = await executeQuery(query, { touristId });

  if (!result.recordset || result.recordset.length === 0) {
    throw new ApiError(404, 'Tourist profile not found');
  }

  // Log the profile data for debugging
  const profile = result.recordset[0];

  // Log detailed information about the profile picture
  if (profile.ProfilePicture) {
    logger.info(`Tourist profile picture found: ${profile.ProfilePicture}`);
  } else {
    logger.info(`No profile picture found for tourist ID: ${touristId}`);
  }

  logger.info(`Tourist profile retrieved: ${JSON.stringify({
    TouristID: profile.TouristID,
    Name: profile.Name,
    ProfilePicture: profile.ProfilePicture
  })}`);

  res.json({
    success: true,
    data: profile
  });
});

// src/controllers/touristController.js - updateTouristProfile method

/**
 * Update tourist profile
 * @route PUT /api/tourists/profile
 */
const updateTouristProfile = catchAsync(async (req, res) => {
  const {
    name,
    phoneNumber,
    country,
    preferredLanguage,
    dateOfBirth,
    gender,
    emergencyContactName,
    emergencyContactPhone,
    travelPreferences
  } = req.body;

  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;

  if (!touristId) {
    throw new ApiError(403, 'Not authorized as tourist');
  }

  // Handle profile picture if uploaded
  let profilePicturePath = undefined;

  logger.info(`Request file: ${JSON.stringify(req.file || 'No file')}`);

  if (req.file) {
    try {
      // Get just the filename
      const filename = req.file.filename;

      // Store the path relative to uploads directory, following our convention
      profilePicturePath = `profile-pictures/${filename}`;

      logger.info(`Profile picture path set to: ${profilePicturePath}`);
    } catch (error) {
      logger.error(`Error processing profile picture: ${error.message}`);
      // Don't update the profile picture if there was an error
      profilePicturePath = undefined;
    }
  }

  // Build update query
  let updateQuery = 'UPDATE Tourists SET ';
  const params = { touristId };
  const updates = [];

  // Add fields to update
  if (name) {
    updates.push('Name = @name');
    params.name = name;
  }

  if (phoneNumber !== undefined) {
    updates.push('PhoneNumber = @phoneNumber');
    params.phoneNumber = phoneNumber;
  }

  if (country) {
    updates.push('Country = @country');
    params.country = country;
  }

  if (preferredLanguage) {
    updates.push('PreferredLanguage = @preferredLanguage');
    params.preferredLanguage = preferredLanguage;
  }

  // Only update profile picture if a new one was uploaded
  if (profilePicturePath !== undefined) {
    updates.push('ProfilePicture = @profilePicture');
    params.profilePicture = profilePicturePath;
    logger.info(`Updating profile picture to: ${profilePicturePath}`);
  }

  if (dateOfBirth) {
    updates.push('DateOfBirth = @dateOfBirth');
    params.dateOfBirth = dateOfBirth;
  }

  if (gender) {
    updates.push('Gender = @gender');
    params.gender = gender;
  }

  if (emergencyContactName !== undefined) {
    updates.push('EmergencyContactName = @emergencyContactName');
    params.emergencyContactName = emergencyContactName;
  }

  if (emergencyContactPhone !== undefined) {
    updates.push('EmergencyContactPhone = @emergencyContactPhone');
    params.emergencyContactPhone = emergencyContactPhone;
  }

  if (travelPreferences !== undefined) {
    updates.push('TravelPreferences = @travelPreferences');
    params.travelPreferences = travelPreferences;
  }

  if (updates.length === 0) {
    throw new ApiError(400, 'No updates provided');
  }

  updateQuery += updates.join(', ');
  updateQuery += ', UpdatedAt = GETDATE() WHERE TouristID = @touristId';

  await executeQuery(updateQuery, params);

  // Get updated profile
  const updatedProfile = await executeQuery(`
    SELECT
      T.TouristID,
      T.Name,
      T.PhoneNumber,
      T.Country,
      T.ProfilePicture,
      T.PreferredLanguage,
      T.DateOfBirth,
      T.Gender,
      T.EmergencyContactName,
      T.EmergencyContactPhone,
      T.TravelPreferences,
      U.Email
    FROM Tourists T
    JOIN Users U ON T.UserID = U.UserID
    WHERE T.TouristID = @touristId
  `, { touristId });

  const profile = updatedProfile.recordset[0];

  logger.info(`Tourist profile updated: ${touristId}`);
  logger.info(`Updated profile data: ${JSON.stringify({
    TouristID: profile.TouristID,
    Name: profile.Name,
    ProfilePicture: profile.ProfilePicture
  })}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: profile
  });
});

/**
 * Change tourist password
 * @route PUT /api/tourists/change-password
 */
const changeTouristPassword = catchAsync(async (req, res) => {
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
  try {
    // First try with UpdatedAt column
    await executeQuery(`
      UPDATE Users
      SET Password = @password, UpdatedAt = GETDATE()
      WHERE UserID = @userId
    `, {
      userId,
      password: hashedPassword
    });
  } catch (error) {
    // If UpdatedAt column doesn't exist, try without it
    if (error.message && error.message.includes('Invalid column name')) {
      logger.warn('UpdatedAt column not found in Users table, updating without it');
      await executeQuery(`
        UPDATE Users
        SET Password = @password
        WHERE UserID = @userId
      `, {
        userId,
        password: hashedPassword
      });
    } else {
      // If it's a different error, rethrow it
      throw error;
    }
  }

  logger.info(`Tourist password changed: user ID ${userId}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Get all tourist trips (history)
 * @route GET /api/tourists/trips
 */
const getTouristTrips = catchAsync(async (req, res) => {
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
      B.Status AS BookingStatus,
      B.TotalAmount,
      B.CreatedAt,
      P.Status AS PaymentStatus,
      V.Make + ' ' + V.Model AS VehicleName,
      V.Type AS VehicleType,
      D.Name AS DriverName,
      D.Rating AS DriverRating,
      DS.Name AS DestinationName
    FROM Bookings B
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
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
 * Submit review for a completed trip
 * @route POST /api/tourists/reviews
 */
const submitReview = catchAsync(async (req, res) => {
  const { bookingId, rating, comment } = req.body;

  if (!bookingId || !rating) {
    throw new ApiError(400, 'Booking ID and rating are required');
  }

  // Validate rating
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, 'Rating must be between 1 and 5');
  }

  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;

  if (!touristId) {
    throw new ApiError(403, 'Not authorized as tourist');
  }

  // Check if booking exists, belongs to tourist, and is completed
  const bookingQuery = `
    SELECT
      B.BookingID,
      B.Status,
      V.VehicleID,
      D.DriverID
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    WHERE B.BookingID = @bookingId AND B.TouristID = @touristId
  `;

  const bookingResult = await executeQuery(bookingQuery, { bookingId, touristId });

  if (!bookingResult.recordset || bookingResult.recordset.length === 0) {
    throw new ApiError(404, 'Booking not found or you do not have permission to review it');
  }

  const booking = bookingResult.recordset[0];

  if (booking.Status !== 'Completed') {
    throw new ApiError(400, 'Only completed trips can be reviewed');
  }

  // Check if review already exists
  const existingReviewQuery = `
    SELECT 1 FROM Reviews
    WHERE BookingID = @bookingId
  `;

  const existingReviewResult = await executeQuery(existingReviewQuery, { bookingId });

  if (existingReviewResult.recordset && existingReviewResult.recordset.length > 0) {
    throw new ApiError(400, 'You have already submitted a review for this trip');
  }

  // Begin transaction
  await executeQuery('BEGIN TRANSACTION');

  try {
    // Insert review
    const reviewQuery = `
      INSERT INTO Reviews (
        BookingID, TouristID, DriverID, VehicleID, Rating, Comment
      )
      VALUES (
        @bookingId, @touristId, @driverId, @vehicleId, @rating, @comment
      );

      SELECT SCOPE_IDENTITY() AS ReviewID;
    `;

    const reviewResult = await executeQuery(reviewQuery, {
      bookingId,
      touristId,
      driverId: booking.DriverID,
      vehicleId: booking.VehicleID,
      rating,
      comment: comment || null
    });

    // Update driver's average rating
    const updateDriverQuery = `
      UPDATE Drivers
      SET
        Rating = (
          SELECT AVG(Rating) FROM Reviews WHERE DriverID = @driverId
        ),
        ReviewCount = (
          SELECT COUNT(*) FROM Reviews WHERE DriverID = @driverId
        ),
        UpdatedAt = GETDATE()
      WHERE DriverID = @driverId
    `;

    await executeQuery(updateDriverQuery, { driverId: booking.DriverID });

    // Commit transaction
    await executeQuery('COMMIT TRANSACTION');

    logger.info(`Review submitted for booking ${bookingId}`);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: {
        reviewId: reviewResult.recordset[0].ReviewID,
        bookingId,
        rating,
        comment
      }
    });
  } catch (error) {
    // Rollback transaction in case of error
    await executeQuery('ROLLBACK TRANSACTION');
    throw error;
  }
});

/**
 * Get tourist reviews
 * @route GET /api/tourists/reviews
 */
const getTouristReviews = catchAsync(async (req, res) => {
  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;

  if (!touristId) {
    throw new ApiError(403, 'Not authorized as tourist');
  }

  const query = `
    SELECT
      R.ReviewID,
      R.BookingID,
      R.Rating,
      R.Comment,
      R.CreatedAt,
      D.Name AS DriverName,
      V.Make + ' ' + V.Model AS VehicleName,
      V.Type AS VehicleType,
      B.TripDate
    FROM Reviews R
    JOIN Bookings B ON R.BookingID = B.BookingID
    JOIN Drivers D ON R.DriverID = D.DriverID
    JOIN Vehicles V ON R.VehicleID = V.VehicleID
    WHERE R.TouristID = @touristId
    ORDER BY R.CreatedAt DESC
  `;

  const result = await executeQuery(query, { touristId });

  res.json({
    success: true,
    count: result.recordset.length,
    data: result.recordset
  });
});

/**
 * Get tourist dashboard data
 * @route GET /api/tourists/dashboard
 */
const getTouristDashboard = catchAsync(async (req, res) => {
  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;

  if (!touristId) {
    throw new ApiError(403, 'Not authorized as tourist');
  }

  // Upcoming trips
  const upcomingTripsQuery = `
    SELECT
      B.BookingID,
      B.TripDate,
      B.TripTime,
      B.PickupLocation,
      B.Status,
      V.Make + ' ' + V.Model AS VehicleName,
      D.Name AS DriverName,
      D.PhoneNumber AS DriverPhone,
      DS.Name AS DestinationName
    FROM Bookings B
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
    WHERE B.TouristID = @touristId AND B.Status IN ('Confirmed', 'Pending')
      AND B.TripDate >= CAST(GETDATE() AS Date)
    ORDER BY B.TripDate ASC, B.TripTime ASC
    OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
  `;

  const upcomingTripsResult = await executeQuery(upcomingTripsQuery, { touristId });

  // Recent bookings
  const recentBookingsQuery = `
    SELECT
      B.BookingID,
      B.TripDate,
      B.Status,
      B.TotalAmount,
      P.Status AS PaymentStatus,
      V.Make + ' ' + V.Model AS VehicleName,
      DS.Name AS DestinationName
    FROM Bookings B
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
    WHERE B.TouristID = @touristId
    ORDER BY B.CreatedAt DESC
    OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY
  `;

  const recentBookingsResult = await executeQuery(recentBookingsQuery, { touristId });

  // Booking statistics
  const statisticsQuery = `
    SELECT
      COUNT(CASE WHEN Status = 'Completed' THEN 1 END) AS CompletedTrips,
      COUNT(CASE WHEN Status = 'Cancelled' THEN 1 END) AS CancelledTrips,
      COUNT(CASE WHEN Status = 'Confirmed' AND TripDate >= CAST(GETDATE() AS Date) THEN 1 END) AS UpcomingTrips,
      COUNT(*) AS TotalTrips,
      SUM(TotalAmount) AS TotalSpent
    FROM Bookings
    WHERE TouristID = @touristId
  `;

  const statisticsResult = await executeQuery(statisticsQuery, { touristId });

  // Favorite destinations (most booked)
  const destinationsQuery = `
    SELECT
      D.DestinationID,
      D.Name,
      COUNT(*) AS BookingCount
    FROM Bookings B
    JOIN Destinations D ON B.DestinationID = D.DestinationID
    WHERE B.TouristID = @touristId AND B.DestinationID IS NOT NULL
    GROUP BY D.DestinationID, D.Name
    ORDER BY BookingCount DESC
    OFFSET 0 ROWS FETCH NEXT 3 ROWS ONLY
  `;

  const destinationsResult = await executeQuery(destinationsQuery, { touristId });

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
        TotalSpent: 0
      },
      favoriteDestinations: destinationsResult.recordset
    }
  });
});

module.exports = {
  getTouristProfile,
  updateTouristProfile,
  changeTouristPassword,
  getTouristTrips,
  submitReview,
  getTouristReviews,
  getTouristDashboard
};