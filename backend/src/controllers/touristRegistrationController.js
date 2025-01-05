// src/controllers/touristRegistrationController.js
const bcrypt = require('bcryptjs');
const { executeQuery } = require('../config/DB/db');
const { catchAsync, ApiError } = require('../utils/errorHandler');
const verificationService = require('../services/verificationService');
const logger = require('../config/logger');

// Helper function to check if a table exists and get its columns
const checkTableSchema = async (tableName) => {
  try {
    const query = `
      IF EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @tableName)
      BEGIN
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @tableName
        ORDER BY ORDINAL_POSITION
      END
      ELSE
      BEGIN
        SELECT 'Table does not exist' AS error
      END
    `;

    const result = await executeQuery(query, { tableName });

    if (result.recordset && result.recordset.some(r => r.error)) {
      logger.error(`Table ${tableName} does not exist`);
      return { exists: false, columns: [] };
    }

    const columns = result.recordset.map(r => r.COLUMN_NAME);
    logger.info(`Table ${tableName} columns: ${columns.join(', ')}`);
    return { exists: true, columns };
  } catch (error) {
    logger.error(`Error checking table schema for ${tableName}: ${error.message}`);
    return { exists: false, columns: [], error: error.message };
  }
};

/**
 * Register a new tourist with robust error handling
 * @route POST /api/tourists/register
 */
const registerTourist = catchAsync(async (req, res) => {
  let profilePicturePath = null;

  try {
    // Extract data from request body with safe defaults
    const {
      name = '',
      email = '',
      password = '',
      phoneNumber = '',
      country = '',
      dateOfBirth = null,
      gender = '',
      preferredLanguage = 'English',
      emergencyContactName = '',
      emergencyContactPhone = '',
      travelPreferences = []
    } = req.body;

    // Handle profile picture if present
    if (req.file) {
      try {
        profilePicturePath = req.file.path.replace(/\\/g, '/').split('uploads/')[1] || null;
        logger.info(`Profile picture path: ${profilePicturePath}`);
      } catch (fileError) {
        logger.warn(`Error processing profile picture: ${fileError.message}`);
        profilePicturePath = null;
      }
    }

    // Log received data
    logger.info(`Registration for email: ${email}`);
    logger.info(`Registration data: ${JSON.stringify({
      name,
      email,
      phoneNumber,
      country,
      dateOfBirth: dateOfBirth || 'not provided',
      gender: gender || 'not provided',
      preferredLanguage,
      hasEmergencyContact: !!(emergencyContactName || emergencyContactPhone),
      hasProfilePicture: !!profilePicturePath,
      hasTravelPreferences: !!travelPreferences
    })}`);

    // Basic validations
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Name is required'
      });
    }

    if (!email || email.trim() === '') {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Email is required'
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Invalid email format'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Password must be at least 6 characters'
      });
    }

    // Check if email exists (prevent duplicate registrations)
    const emailCheck = await executeQuery(
      `SELECT COUNT(*) AS count FROM Users WHERE email = @email`,
      { email }
    );

    if (emailCheck.recordset[0].count > 0) {
      return res.status(400).json({
        success: false,
        statusCode: 400,
        message: 'Email already registered'
      });
    }

    // Process date of birth
    let formattedDate = null;
    if (dateOfBirth) {
      try {
        const date = new Date(dateOfBirth);
        if (!isNaN(date.getTime())) {
          // Check if date is in the future
          const today = new Date();
          if (date > today) {
            return res.status(400).json({
              success: false,
              statusCode: 400,
              message: 'Date of birth cannot be in the future'
            });
          }

          // Format as YYYY-MM-DD
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        }
      } catch (error) {
        logger.warn(`Date parsing error: ${error.message}`);
        formattedDate = null;
      }
    }

    // Format travel preferences
    let parsedPreferences = null;
    if (travelPreferences) {
      try {
        if (typeof travelPreferences === 'string') {
          parsedPreferences = travelPreferences.startsWith('[')
            ? travelPreferences
            : JSON.stringify([travelPreferences]);
        } else if (Array.isArray(travelPreferences)) {
          parsedPreferences = JSON.stringify(travelPreferences);
        }
      } catch (error) {
        logger.warn(`Travel preferences parsing error: ${error.message}`);
        parsedPreferences = null;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check Users table schema
    const usersSchema = await checkTableSchema('Users');
    if (!usersSchema.exists) {
      logger.error('Users table does not exist in the database');

      // Try to create the Users table
      try {
        logger.info('Attempting to create Users table...');
        const createUsersTableQuery = `
          CREATE TABLE Users (
            user_id INT IDENTITY(1,1) PRIMARY KEY,
            full_name NVARCHAR(100) NOT NULL,
            email NVARCHAR(100) UNIQUE NOT NULL,
            password NVARCHAR(255) NOT NULL,
            phone NVARCHAR(15),
            role VARCHAR(10) NOT NULL CHECK (role IN ('traveler', 'driver', 'admin')),
            profile_photo NVARCHAR(255),
            created_at DATETIME DEFAULT GETDATE()
          )
        `;
        await executeQuery(createUsersTableQuery);
        logger.info('Users table created successfully');

        // Refresh the schema
        const refreshedSchema = await checkTableSchema('Users');
        if (!refreshedSchema.exists) {
          throw new Error('Failed to create Users table');
        }
        logger.info(`Users table columns after creation: ${refreshedSchema.columns.join(', ')}`);
      } catch (createError) {
        logger.error('Error creating Users table:', createError);
        throw new Error('Users table does not exist and could not be created');
      }
    } else {
      logger.info(`Users table columns: ${usersSchema.columns.join(', ')}`);
    }

    // Create user first
    const createUserQuery = `
      INSERT INTO Users (full_name, email, password, phone, role)
      VALUES (@name, @email, @password, @phone, 'traveler');
      SELECT SCOPE_IDENTITY() AS userId;
    `;

    // Log the query parameters
    logger.info('Executing user creation query with parameters:');
    logger.info(JSON.stringify({
      name,
      email,
      phone: phoneNumber || null
    }));

    const userResult = await executeQuery(createUserQuery, {
      name,
      email,
      password: hashedPassword,
      phone: phoneNumber || null
    });

    if (!userResult.recordset || userResult.recordset.length === 0) {
      throw new Error('Failed to create user');
    }

    const userId = userResult.recordset[0].userId;

    // Check Tourists table schema
    const touristsSchema = await checkTableSchema('Tourists');
    if (!touristsSchema.exists) {
      logger.error('Tourists table does not exist in the database');

      // Try to create the Tourists table
      try {
        logger.info('Attempting to create Tourists table...');
        const createTouristsTableQuery = `
          CREATE TABLE Tourists (
            tourist_id INT IDENTITY(1,1) PRIMARY KEY,
            user_id INT UNIQUE NOT NULL,
            full_name NVARCHAR(100) NOT NULL,
            phone_number NVARCHAR(20),
            country NVARCHAR(100),
            date_of_birth DATE,
            gender NVARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
            preferred_language NVARCHAR(50) DEFAULT 'English',
            emergency_contact_name NVARCHAR(100),
            emergency_contact_phone NVARCHAR(20),
            profile_picture NVARCHAR(MAX),
            travel_preferences NVARCHAR(MAX),
            registration_date DATETIME DEFAULT GETDATE(),
            updated_at DATETIME NULL,
            status NVARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Banned')),
            FOREIGN KEY (user_id) REFERENCES Users(user_id) ON DELETE CASCADE
          )
        `;
        await executeQuery(createTouristsTableQuery);
        logger.info('Tourists table created successfully');

        // Refresh the schema
        const refreshedSchema = await checkTableSchema('Tourists');
        if (!refreshedSchema.exists) {
          throw new Error('Failed to create Tourists table');
        }
        logger.info(`Tourists table columns after creation: ${refreshedSchema.columns.join(', ')}`);
      } catch (createError) {
        logger.error('Error creating Tourists table:', createError);
        throw new Error('Tourists table does not exist and could not be created');
      }
    } else {
      logger.info(`Tourists table columns: ${touristsSchema.columns.join(', ')}`);
    }

    // Create tourist profile with only the columns that exist
    const createTouristQuery = `
      INSERT INTO Tourists (
        user_id,
        full_name,
        phone_number,
        country,
        date_of_birth,
        gender,
        preferred_language,
        emergency_contact_name,
        emergency_contact_phone,
        profile_picture,
        travel_preferences,
        registration_date,
        status
      )
      VALUES (
        @userId,
        @name,
        @phoneNumber,
        @country,
        @dateOfBirth,
        @gender,
        @preferredLanguage,
        @emergencyContactName,
        @emergencyContactPhone,
        @profilePicture,
        @travelPreferences,
        GETDATE(),
        'Active'
      );
      SELECT SCOPE_IDENTITY() AS touristId;
    `;

    // Log the tourist creation parameters
    logger.info('Executing tourist creation query with parameters:');
    logger.info(JSON.stringify({
      userId,
      name,
      phoneNumber: phoneNumber || null,
      country: country || null,
      dateOfBirth: formattedDate || null,
      gender: gender || null,
      preferredLanguage: preferredLanguage || 'English',
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      profilePicture: profilePicturePath ? 'provided' : 'null',
      travelPreferences: parsedPreferences ? 'provided' : 'null'
    }));

    const touristResult = await executeQuery(createTouristQuery, {
      userId,
      name,
      phoneNumber: phoneNumber || null,
      country: country || null,
      dateOfBirth: formattedDate,
      gender: gender || null,
      preferredLanguage: preferredLanguage || 'English',
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      profilePicture: profilePicturePath,
      travelPreferences: parsedPreferences
    });

    if (!touristResult.recordset || touristResult.recordset.length === 0) {
      // Attempt to rollback if tourist creation fails
      await executeQuery(`DELETE FROM Users WHERE user_id = @userId`, { userId });
      throw new Error('Failed to create tourist profile');
    }

    const touristId = touristResult.recordset[0].touristId;

    // Try to send verification email
    try {
      const token = await verificationService.createVerification(userId);
      await verificationService.sendVerificationEmail(email, name, token);
    } catch (emailError) {
      logger.error(`Failed to send verification email: ${emailError.message}`);
      // Continue even if email fails
    }

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Tourist registered successfully',
      data: {
        userId,
        touristId,
        email
      }
    });

  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    logger.error(error.stack);

    // Return user-friendly error message
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: `Registration failed: ${error.message}`
    });
  }
});

module.exports = {
  registerTourist
};