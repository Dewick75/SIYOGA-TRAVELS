// src/controllers/destinationController.js
const { executeQuery } = require('../config/DB/db');
const { catchAsync, ApiError } = require('../utils/errorHandler');
const logger = require('../config/logger');

/**
 * Get all destinations
 * @route GET /api/destinations
 */
const getAllDestinations = catchAsync(async (req, res) => {
  const { search, status = 'Active' } = req.query;
  
  let query = `
    SELECT 
      DestinationID, 
      Name, 
      Location, 
      Description, 
      ImageURL, 
      Activities,
      Status
    FROM Destinations
    WHERE Status = @status
  `;
  
  const params = { status };
  
  // Add search filter if provided
  if (search) {
    query += ` AND (Name LIKE @search OR Location LIKE @search)`;
    params.search = `%${search}%`;
  }
  
  query += ` ORDER BY Name ASC`;
  
  const result = await executeQuery(query, params);
  
  // Parse Activities JSON if it exists
  const destinations = result.recordset.map(dest => ({
    ...dest,
    Activities: dest.Activities ? JSON.parse(dest.Activities) : []
  }));
  
  res.json({
    success: true,
    count: destinations.length,
    data: destinations
  });
});

/**
 * Get destination by ID
 * @route GET /api/destinations/:id
 */
const getDestinationById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT 
      DestinationID, 
      Name, 
      Location, 
      Description, 
      ImageURL, 
      Activities,
      Status
    FROM Destinations
    WHERE DestinationID = @id
  `;
  
  const result = await executeQuery(query, { id });
  
  if (!result.recordset || result.recordset.length === 0) {
    throw new ApiError(404, 'Destination not found');
  }
  
  const destination = result.recordset[0];
  
  // Parse activities JSON if it exists
  destination.Activities = destination.Activities ? JSON.parse(destination.Activities) : [];
  
  res.json({
    success: true,
    data: destination
  });
});

/**
 * Create a new destination (admin only)
 * @route POST /api/destinations
 */
const createDestination = catchAsync(async (req, res) => {
  const { name, location, description, imageUrl, activities } = req.body;
  
  // Validate required fields
  if (!name || !location) {
    throw new ApiError(400, 'Name and location are required');
  }
  
  // Convert activities array to JSON string
  const activitiesJson = activities ? JSON.stringify(activities) : null;
  
  const query = `
    INSERT INTO Destinations (Name, Location, Description, ImageURL, Activities, Status)
    VALUES (@name, @location, @description, @imageUrl, @activities, 'Active');
    
    SELECT SCOPE_IDENTITY() AS DestinationID;
  `;
  
  const result = await executeQuery(query, {
    name,
    location,
    description: description || null,
    imageUrl: imageUrl || null,
    activities: activitiesJson
  });
  
  if (!result.recordset || !result.recordset[0]) {
    throw new ApiError(500, 'Failed to create destination');
  }
  
  const destinationId = result.recordset[0].DestinationID;
  
  // Get the newly created destination
  const newDestination = await executeQuery(
    'SELECT * FROM Destinations WHERE DestinationID = @id',
    { id: destinationId }
  );
  
  // Parse activities JSON
  const destination = {
    ...newDestination.recordset[0],
    Activities: newDestination.recordset[0].Activities 
      ? JSON.parse(newDestination.recordset[0].Activities) 
      : []
  };
  
  logger.info(`New destination created: ${name}`);
  
  res.status(201).json({
    success: true,
    message: 'Destination created successfully',
    data: destination
  });
});

/**
 * Update a destination (admin only)
 * @route PUT /api/destinations/:id
 */
const updateDestination = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { name, location, description, imageUrl, activities, status } = req.body;
  
  // Check if destination exists
  const checkQuery = 'SELECT 1 FROM Destinations WHERE DestinationID = @id';
  const checkResult = await executeQuery(checkQuery, { id });
  
  if (!checkResult.recordset || checkResult.recordset.length === 0) {
    throw new ApiError(404, 'Destination not found');
  }
  
  // Convert activities array to JSON string
  const activitiesJson = activities ? JSON.stringify(activities) : undefined;
  
  // Build update query
  let updateQuery = 'UPDATE Destinations SET ';
  const params = { id };
  const updates = [];
  
  if (name) {
    updates.push('Name = @name');
    params.name = name;
  }
  
  if (location) {
    updates.push('Location = @location');
    params.location = location;
  }
  
  if (description !== undefined) {
    updates.push('Description = @description');
    params.description = description;
  }
  
  if (imageUrl !== undefined) {
    updates.push('ImageURL = @imageUrl');
    params.imageUrl = imageUrl;
  }
  
  if (activitiesJson !== undefined) {
    updates.push('Activities = @activities');
    params.activities = activitiesJson;
  }
  
  if (status) {
    updates.push('Status = @status');
    params.status = status;
  }
  
  if (updates.length === 0) {
    throw new ApiError(400, 'No updates provided');
  }
  
  updateQuery += updates.join(', ');
  updateQuery += ', UpdatedAt = GETDATE() WHERE DestinationID = @id';
  
  await executeQuery(updateQuery, params);
  
  // Get the updated destination
  const updatedDestination = await executeQuery(
    'SELECT * FROM Destinations WHERE DestinationID = @id',
    { id }
  );
  
  // Parse activities JSON
  const destination = {
    ...updatedDestination.recordset[0],
    Activities: updatedDestination.recordset[0].Activities 
      ? JSON.parse(updatedDestination.recordset[0].Activities) 
      : []
  };
  
  logger.info(`Destination updated: ${id}`);
  
  res.json({
    success: true,
    message: 'Destination updated successfully',
    data: destination
  });
});

/**
 * Delete a destination (admin only)
 * @route DELETE /api/destinations/:id
 */
const deleteDestination = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if destination exists
  const checkQuery = 'SELECT 1 FROM Destinations WHERE DestinationID = @id';
  const checkResult = await executeQuery(checkQuery, { id });
  
  if (!checkResult.recordset || checkResult.recordset.length === 0) {
    throw new ApiError(404, 'Destination not found');
  }
  
  // Check if destination is used in any bookings
  const bookingQuery = 'SELECT 1 FROM Bookings WHERE DestinationID = @id';
  const bookingResult = await executeQuery(bookingQuery, { id });
  
  if (bookingResult.recordset && bookingResult.recordset.length > 0) {
    // Set status to inactive instead of deleting
    await executeQuery(
      'UPDATE Destinations SET Status = @status, UpdatedAt = GETDATE() WHERE DestinationID = @id',
      { id, status: 'Inactive' }
    );
    
    logger.info(`Destination marked as inactive: ${id}`);
    
    return res.json({
      success: true,
      message: 'Destination is in use and has been marked as inactive'
    });
  }
  
  // Delete the destination
  await executeQuery('DELETE FROM Destinations WHERE DestinationID = @id', { id });
  
  logger.info(`Destination deleted: ${id}`);
  
  res.json({
    success: true,
    message: 'Destination deleted successfully'
  });
});

module.exports = {
  getAllDestinations,
  getDestinationById,
  createDestination,
  updateDestination,
  deleteDestination
};