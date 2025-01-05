// src/controllers/paymentController.js
const { executeQuery } = require('../config/DB/db');
const { catchAsync, ApiError } = require('../utils/errorHandler');
const { processPayment } = require('../services/paymentService');
const { sendEmail } = require('../services/emailService');
const logger = require('../config/logger');

/**
 * Process payment for a booking
 * @route POST /api/payments/process
 */
const processBookingPayment = catchAsync(async (req, res) => {
  const { 
    bookingId, 
    paymentMethod, 
    cardDetails,
    savePaymentMethod
  } = req.body;
  
  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;
  
  if (!touristId) {
    throw new ApiError(403, 'Only tourists can make payments');
  }
  
  // Validate required fields
  if (!bookingId || !paymentMethod) {
    throw new ApiError(400, 'Booking ID and payment method are required');
  }
  
  // Check if booking exists and belongs to the tourist
  const bookingQuery = `
    SELECT 
      B.BookingID, 
      B.TotalAmount, 
      B.Status AS BookingStatus,
      P.PaymentID,
      P.Status AS PaymentStatus
    FROM Bookings B
    LEFT JOIN Payments P ON B.BookingID = P.BookingID
    WHERE B.BookingID = @bookingId AND B.TouristID = @touristId
  `;
  
  const bookingResult = await executeQuery(bookingQuery, { bookingId, touristId });
  
  if (!bookingResult.recordset || bookingResult.recordset.length === 0) {
    throw new ApiError(404, 'Booking not found or you do not have permission to make payment');
  }
  
  const booking = bookingResult.recordset[0];
  
  // Check if booking is already paid
  if (booking.PaymentStatus === 'Completed') {
    throw new ApiError(400, 'Payment has already been completed for this booking');
  }
  
  // Check if booking is cancelled
  if (booking.BookingStatus === 'Cancelled') {
    throw new ApiError(400, 'Cannot make payment for a cancelled booking');
  }
  
  let paymentId = booking.PaymentID;
  
  // Process payment using payment service (external gateway integration)
  const paymentResult = await processPayment({
    amount: booking.TotalAmount,
    paymentMethod,
    cardDetails,
    description: `Booking #${bookingId} - Siyoga Travels`,
    metadata: {
      bookingId,
      touristId
    }
  });
  
  if (!paymentResult.success) {
    // Update payment status to Failed
    await executeQuery(`
      UPDATE Payments
      SET Status = 'Failed', 
          ErrorMessage = @errorMessage,
          UpdatedAt = GETDATE()
      WHERE PaymentID = @paymentId
    `, { 
      paymentId, 
      errorMessage: paymentResult.error 
    });
    
    logger.error(`Payment failed for booking ${bookingId}: ${paymentResult.error}`);
    
    throw new ApiError(400, `Payment failed: ${paymentResult.error}`);
  }
  
  // Begin transaction
  await executeQuery('BEGIN TRANSACTION');
  
  try {
    // Update payment status
    await executeQuery(`
      UPDATE Payments
      SET Status = 'Completed', 
          Method = @paymentMethod,
          TransactionID = @transactionId,
          ProcessedAt = GETDATE(),
          UpdatedAt = GETDATE()
      WHERE PaymentID = @paymentId
    `, { 
      paymentId, 
      paymentMethod, 
      transactionId: paymentResult.transactionId 
    });
    
    // Update booking status to Confirmed
    await executeQuery(`
      UPDATE Bookings
      SET Status = 'Confirmed', 
          UpdatedAt = GETDATE()
      WHERE BookingID = @bookingId
    `, { bookingId });
    
    // If user chose to save payment method
    if (savePaymentMethod && cardDetails) {
      // Check if saved method already exists
      const savedMethodQuery = `
        SELECT 1 FROM SavedPaymentMethods
        WHERE TouristID = @touristId AND Last4Digits = @last4
      `;
      
      const savedMethodResult = await executeQuery(savedMethodQuery, { 
        touristId, 
        last4: cardDetails.last4 
      });
      
      // Only save if not already saved
      if (!savedMethodResult.recordset || savedMethodResult.recordset.length === 0) {
        await executeQuery(`
          INSERT INTO SavedPaymentMethods (
            TouristID, CardType, Last4Digits, ExpiryMonth, ExpiryYear, IsDefault
          )
          VALUES (
            @touristId, @cardType, @last4, @expiryMonth, @expiryYear, 
            CASE WHEN NOT EXISTS (SELECT 1 FROM SavedPaymentMethods WHERE TouristID = @touristId) THEN 1 ELSE 0 END
          )
        `, { 
          touristId, 
          cardType: cardDetails.cardType,
          last4: cardDetails.last4,
          expiryMonth: cardDetails.expiryMonth,
          expiryYear: cardDetails.expiryYear
        });
      }
    }
    
    // Commit transaction
    await executeQuery('COMMIT TRANSACTION');
    
    // Get booking details for email
    const bookingDetailsQuery = `
      SELECT 
        B.TripDate, 
        B.TripTime,
        B.PickupLocation,
        V.Make + ' ' + V.Model AS VehicleName,
        V.Type AS VehicleType,
        D.Name AS DriverName,
        D.PhoneNumber AS DriverPhone,
        DS.Name AS DestinationName
      FROM Bookings B
      JOIN Vehicles V ON B.VehicleID = V.VehicleID
      JOIN Drivers D ON V.DriverID = D.DriverID
      LEFT JOIN Destinations DS ON B.DestinationID = DS.DestinationID
      WHERE B.BookingID = @bookingId
    `;
    
    const bookingDetailsResult = await executeQuery(bookingDetailsQuery, { bookingId });
    const bookingDetails = bookingDetailsResult.recordset[0];
    
    // Send payment confirmation email to tourist
    await sendEmail({
      to: req.user.Email,
      subject: 'Payment Confirmation - Siyoga Travels',
      text: `Your payment for booking #${bookingId} has been processed successfully.
      
      Booking Details:
      - Date: ${bookingDetails.TripDate}
      - Time: ${bookingDetails.TripTime}
      - Pickup: ${bookingDetails.PickupLocation}
      - Vehicle: ${bookingDetails.VehicleName} (${bookingDetails.VehicleType})
      - Driver: ${bookingDetails.DriverName} (${bookingDetails.DriverPhone})
      - Destination: ${bookingDetails.DestinationName || 'Custom Trip'}
      - Amount Paid: $${booking.TotalAmount}
      
      Thank you for choosing Siyoga Travels!`
    });
    
    // Get driver's email for notification
    const driverQuery = `
      SELECT U.Email
      FROM Users U
      JOIN Drivers D ON U.UserID = D.UserID
      JOIN Vehicles V ON D.DriverID = V.DriverID
      JOIN Bookings B ON V.VehicleID = B.VehicleID
      WHERE B.BookingID = @bookingId
    `;
    
    const driverResult = await executeQuery(driverQuery, { bookingId });
    
    if (driverResult.recordset && driverResult.recordset[0]) {
      // Notify driver about confirmed booking
      await sendEmail({
        to: driverResult.recordset[0].Email,
        subject: 'Booking Confirmed - Siyoga Travels',
        text: `A booking has been confirmed with payment.
        
        Booking Details:
        - Booking ID: ${bookingId}
        - Date: ${bookingDetails.TripDate}
        - Time: ${bookingDetails.TripTime}
        - Pickup: ${bookingDetails.PickupLocation}
        - Amount: $${booking.TotalAmount}
        
        Please log in to your account for more details.`
      });
    }
    
    logger.info(`Payment completed for booking ${bookingId}`);
    
    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        bookingId,
        paymentId,
        transactionId: paymentResult.transactionId,
        amount: booking.TotalAmount,
        status: 'Completed'
      }
    });
  } catch (error) {
    // Rollback transaction in case of error
    await executeQuery('ROLLBACK TRANSACTION');
    
    logger.error(`Error processing payment for booking ${bookingId}: ${error.message}`);
    
    // If payment was processed but DB operations failed, we need to reverse the charge
    // This would be handled in a production system
    
    throw error;
  }
});

/**
 * Get payment details by booking ID
 * @route GET /api/payments/booking/:bookingId
 */
const getPaymentByBooking = catchAsync(async (req, res) => {
  const { bookingId } = req.params;
  
  // Check user authorization
  const isTourist = req.user.Role === 'Tourist';
  const isDriver = req.user.Role === 'Driver';
  const isAdmin = req.user.Role === 'Admin';
  
  // Build query based on user role
  let query = `
    SELECT 
      P.PaymentID, 
      P.BookingID,
      P.Method,
      P.Amount,
      P.Status,
      P.TransactionID,
      P.ProcessedAt,
      P.ErrorMessage,
      P.CreatedAt,
      P.UpdatedAt,
      B.TouristID,
      T.Name AS TouristName,
      D.DriverID,
      D.Name AS DriverName
    FROM Payments P
    JOIN Bookings B ON P.BookingID = B.BookingID
    JOIN Tourists T ON B.TouristID = T.TouristID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
    WHERE P.BookingID = @bookingId
  `;
  
  // Add authorization constraint for tourists and drivers
  if (isTourist) {
    query += ` AND T.TouristID = @userId`;
  } else if (isDriver) {
    query += ` AND D.DriverID = @userId`;
  }
  
  const result = await executeQuery(query, { 
    bookingId, 
    userId: req.user.RoleID 
  });
  
  if (!result.recordset || result.recordset.length === 0) {
    throw new ApiError(404, 'Payment not found or you do not have permission to view it');
  }
  
  const payment = result.recordset[0];
  
  res.json({
    success: true,
    data: payment
  });
});

/**
 * Get all payments (admin only)
 * @route GET /api/payments
 */
const getAllPayments = catchAsync(async (req, res) => {
  // Only admin can access all payments
  if (req.user.Role !== 'Admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }
  
  const { status, startDate, endDate } = req.query;
  
  let query = `
    SELECT 
      P.PaymentID, 
      P.BookingID,
      P.Method,
      P.Amount,
      P.Status,
      P.TransactionID,
      P.ProcessedAt,
      P.CreatedAt,
      B.TripDate,
      B.Status AS BookingStatus,
      T.TouristID,
      T.Name AS TouristName,
      D.DriverID,
      D.Name AS DriverName
    FROM Payments P
    JOIN Bookings B ON P.BookingID = B.BookingID
    JOIN Tourists T ON B.TouristID = T.TouristID
    JOIN Vehicles V ON B.VehicleID = V.VehicleID
    JOIN Drivers D ON V.DriverID = D.DriverID
  `;
  
  const params = {};
  const conditions = [];
  
  // Add filters if provided
  if (status) {
    conditions.push('P.Status = @status');
    params.status = status;
  }
  
  if (startDate) {
    conditions.push('P.CreatedAt >= @startDate');
    params.startDate = startDate;
  }
  
  if (endDate) {
    conditions.push('P.CreatedAt <= @endDate');
    params.endDate = endDate;
  }
  
  // Add WHERE clause if any conditions
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  // Order by creation date
  query += ' ORDER BY P.CreatedAt DESC';
  
  const result = await executeQuery(query, params);
  
  res.json({
    success: true,
    count: result.recordset.length,
    data: result.recordset
  });
});

/**
 * Get saved payment methods for tourist
 * @route GET /api/payments/methods
 */
const getSavedPaymentMethods = catchAsync(async (req, res) => {
  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;
  
  if (req.user.Role !== 'Tourist') {
    throw new ApiError(403, 'Not authorized as tourist');
  }
  
  const query = `
    SELECT 
      MethodID, 
      CardType, 
      Last4Digits, 
      ExpiryMonth, 
      ExpiryYear, 
      IsDefault
    FROM SavedPaymentMethods
    WHERE TouristID = @touristId
    ORDER BY IsDefault DESC, CreatedAt DESC
  `;
  
  const result = await executeQuery(query, { touristId });
  
  res.json({
    success: true,
    count: result.recordset.length,
    data: result.recordset
  });
});

/**
 * Delete saved payment method
 * @route DELETE /api/payments/methods/:id
 */
const deleteSavedPaymentMethod = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;
  
  if (req.user.Role !== 'Tourist') {
    throw new ApiError(403, 'Not authorized as tourist');
  }
  
  // Check if payment method exists and belongs to the tourist
  const checkQuery = `
    SELECT IsDefault FROM SavedPaymentMethods
    WHERE MethodID = @id AND TouristID = @touristId
  `;
  
  const checkResult = await executeQuery(checkQuery, { id, touristId });
  
  if (!checkResult.recordset || checkResult.recordset.length === 0) {
    throw new ApiError(404, 'Payment method not found or you do not have permission to delete it');
  }
  
  // Begin transaction
  await executeQuery('BEGIN TRANSACTION');
  
  try {
    const isDefault = checkResult.recordset[0].IsDefault;
    
    // Delete payment method
    await executeQuery(`
      DELETE FROM SavedPaymentMethods
      WHERE MethodID = @id AND TouristID = @touristId
    `, { id, touristId });
    
    // If deleted method was default, set the most recent method as default
    if (isDefault) {
      await executeQuery(`
        UPDATE SavedPaymentMethods
        SET IsDefault = 1
        WHERE TouristID = @touristId AND MethodID = (
          SELECT TOP 1 MethodID FROM SavedPaymentMethods 
          WHERE TouristID = @touristId 
          ORDER BY CreatedAt DESC
        )
      `, { touristId });
    }
    
    // Commit transaction
    await executeQuery('COMMIT TRANSACTION');
    
    res.json({
      success: true,
      message: 'Payment method deleted successfully'
    });
  } catch (error) {
    // Rollback transaction in case of error
    await executeQuery('ROLLBACK TRANSACTION');
    throw error;
  }
});

/**
 * Set default payment method
 * @route PUT /api/payments/methods/:id/default
 */
const setDefaultPaymentMethod = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Get tourist ID from authenticated user
  const touristId = req.user.RoleID;
  
  if (req.user.Role !== 'Tourist') {
    throw new ApiError(403, 'Not authorized as tourist');
  }
  
  // Check if payment method exists and belongs to the tourist
  const checkQuery = `
    SELECT 1 FROM SavedPaymentMethods
    WHERE MethodID = @id AND TouristID = @touristId
  `;
  
  const checkResult = await executeQuery(checkQuery, { id, touristId });
  
  if (!checkResult.recordset || checkResult.recordset.length === 0) {
    throw new ApiError(404, 'Payment method not found or you do not have permission to set it as default');
  }
  
  // Begin transaction
  await executeQuery('BEGIN TRANSACTION');
  
  try {
    // First, reset all methods to non-default
    await executeQuery(`
      UPDATE SavedPaymentMethods
      SET IsDefault = 0
      WHERE TouristID = @touristId
    `, { touristId });
    
    // Then set the selected method as default
    await executeQuery(`
      UPDATE SavedPaymentMethods
      SET IsDefault = 1
      WHERE MethodID = @id AND TouristID = @touristId
    `, { id, touristId });
    
    // Commit transaction
    await executeQuery('COMMIT TRANSACTION');
    
    res.json({
      success: true,
      message: 'Default payment method updated successfully'
    });
  } catch (error) {
    // Rollback transaction in case of error
    await executeQuery('ROLLBACK TRANSACTION');
    throw error;
  }
});

/**
 * Get payment statistics for admin dashboard
 * @route GET /api/payments/statistics
 */
const getPaymentStatistics = catchAsync(async (req, res) => {
  // Only admin can access payment statistics
  if (req.user.Role !== 'Admin') {
    throw new ApiError(403, 'Not authorized as admin');
  }
  
  // Total revenue
  const revenueQuery = `
    SELECT SUM(Amount) AS TotalRevenue
    FROM Payments
    WHERE Status = 'Completed'
  `;
  
  const revenueResult = await executeQuery(revenueQuery);
  
  // Revenue by payment method
  const methodQuery = `
    SELECT Method, COUNT(*) AS Count, SUM(Amount) AS Amount
    FROM Payments
    WHERE Status = 'Completed'
    GROUP BY Method
  `;
  
  const methodResult = await executeQuery(methodQuery);
  
  // Monthly revenue (last 6 months)
  const monthlyQuery = `
    SELECT 
      DATEPART(YEAR, ProcessedAt) AS Year,
      DATEPART(MONTH, ProcessedAt) AS Month,
      COUNT(*) AS PaymentCount,
      SUM(Amount) AS Revenue
    FROM Payments
    WHERE Status = 'Completed'
      AND ProcessedAt >= DATEADD(MONTH, -6, GETDATE())
    GROUP BY DATEPART(YEAR, ProcessedAt), DATEPART(MONTH, ProcessedAt)
    ORDER BY Year, Month
  `;
  
  const monthlyResult = await executeQuery(monthlyQuery);
  
  // Payment status distribution
  const statusQuery = `
    SELECT Status, COUNT(*) AS Count
    FROM Payments
    GROUP BY Status
  `;
  
  const statusResult = await executeQuery(statusQuery);
  
  res.json({
    success: true,
    data: {
      totalRevenue: revenueResult.recordset[0]?.TotalRevenue || 0,
      revenueByMethod: methodResult.recordset,
      monthlyRevenue: monthlyResult.recordset,
      paymentStatusDistribution: statusResult.recordset
    }
  });
});

module.exports = {
  processBookingPayment,
  getPaymentByBooking,
  getAllPayments,
  getSavedPaymentMethods,
  deleteSavedPaymentMethod,
  setDefaultPaymentMethod,
  getPaymentStatistics
};