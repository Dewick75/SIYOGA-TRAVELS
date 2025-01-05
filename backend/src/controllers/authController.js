// src/controllers/authController.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { executeQuery, executeStoredProcedure } = require('../config/DB/db');
const { catchAsync, ApiError } = require('../utils/errorHandler');
const { generateToken, generateRefreshToken, verifyToken } = require('../utils/tokenManager');
const verificationService = require('../services/verificationService');
const logger = require('../config/logger');

/**
 * Register a new tourist
 * @route POST /api/auth/register/tourist
 */
const registerTourist = catchAsync(async (req, res) => {
  // Log the entire request body for debugging
  logger.info(`Full request body: ${JSON.stringify(req.body)}`);

  // Extract data from request body
  const {
    name,
    email,
    password,
    phoneNumber,
    country,
    dateOfBirth,
    gender,
    preferredLanguage,
    emergencyContactName,
    emergencyContactPhone,
    travelPreferences
  } = req.body;

  // Log extracted values for debugging
  logger.info(`Extracted values:
    name: ${name}
    email: ${email}
    phoneNumber: ${phoneNumber}
    country: ${country}
    dateOfBirth: ${dateOfBirth}
    gender: ${gender}
    preferredLanguage: ${preferredLanguage}
    emergencyContactName: ${emergencyContactName}
    emergencyContactPhone: ${emergencyContactPhone}
    travelPreferences: ${travelPreferences}
  `);

  // Handle profile picture if uploaded
  let profilePicturePath = null;
  if (req.file) {
    // Get the relative path to the profile picture
    profilePicturePath = req.file.path.replace(/\\/g, '/').split('uploads/')[1];
    logger.info(`Profile picture uploaded: ${profilePicturePath}`);
  }

  try {
    // Log the request body for debugging
    logger.info('Request body received:', req.body);

    // Validate inputs
    if (!email || !name || !password) {
      throw new ApiError(400, 'Email, name, and password are required');
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      throw new ApiError(400, 'Invalid email format');
    }

    if (password.length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters');
    }

    // Validate phone number (only digits)
    if (phoneNumber) {
      logger.info(`Validating phone number: ${phoneNumber}, type: ${typeof phoneNumber}`);
      if (!/^\d+$/.test(phoneNumber)) {
        throw new ApiError(400, 'Phone number must contain only numbers');
      }
    }

    // Validate country (should be a 2-letter country code)
    if (country) {
      // Check if it's a 2-letter country code
      if (country.length !== 2 && !['Australia', 'Canada', 'China', 'France', 'Germany', 'India', 'Italy', 'Japan', 'Russia', 'United Kingdom', 'United States', 'Sri Lanka'].includes(country)) {
        throw new ApiError(400, 'Please provide a valid 2-letter country code (e.g., US, GB, AU)');
      }

      // If it's a full country name, convert it to country code
      if (country === 'Australia') country = 'AU';
      else if (country === 'Canada') country = 'CA';
      else if (country === 'China') country = 'CN';
      else if (country === 'France') country = 'FR';
      else if (country === 'Germany') country = 'DE';
      else if (country === 'India') country = 'IN';
      else if (country === 'Italy') country = 'IT';
      else if (country === 'Japan') country = 'JP';
      else if (country === 'Russia') country = 'RU';
      else if (country === 'United Kingdom') country = 'GB';
      else if (country === 'United States') country = 'US';
      else if (country === 'Sri Lanka') country = 'LK';
    }


    // Validate gender
    if (gender && !['Male', 'Female', 'Other', 'Prefer not to say'].includes(gender)) {
      throw new ApiError(400, 'Gender must be Male, Female, Other, or Prefer not to say');
    }

    // Validate emergency contact phone (only digits)
    if (emergencyContactPhone) {
      logger.info(`Validating emergency contact phone: ${emergencyContactPhone}, type: ${typeof emergencyContactPhone}`);
      if (!/^\d+$/.test(emergencyContactPhone)) {
        throw new ApiError(400, 'Emergency contact phone must contain only numbers');
      }
    }

    // Validate travel preferences
    if (travelPreferences) {
      try {
        // If it's a string that's not already a JSON array, convert it
        if (typeof travelPreferences === 'string' && !travelPreferences.startsWith('[')) {
          travelPreferences = JSON.stringify([travelPreferences]);
        } else if (typeof travelPreferences === 'string') {
          // Verify it's valid JSON
          JSON.parse(travelPreferences);
        } else if (Array.isArray(travelPreferences)) {
          // Convert array to JSON string
          travelPreferences = JSON.stringify(travelPreferences);
        } else {
          // Convert other types to array with single item
          travelPreferences = JSON.stringify([travelPreferences]);
        }
      } catch (e) {
        throw new ApiError(400, 'Invalid travel preferences format');
      }
    }

    // Check if email already exists
    const emailCheckResult = await executeQuery(
      `SELECT user_id FROM Users WHERE email = @email`,
      { email }
    );

    if (emailCheckResult.recordset && emailCheckResult.recordset.length > 0) {
      throw new ApiError(400, 'Email already registered');
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Log the parameters for debugging
    logger.info(`Registering tourist with parameters: ${JSON.stringify({
      email,
      name,
      phoneNumber: phoneNumber || null,
      country: country || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      preferredLanguage: preferredLanguage || 'English',
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone || null,
      travelPreferences: travelPreferences ? 'Present' : 'Null'
    })}`);

    // Log all parameters before executing the query
    logger.info('Preparing to execute SQL query with parameters:');
    logger.info(`- email: ${email}`);
    logger.info(`- name: ${name}`);
    logger.info(`- phoneNumber: ${phoneNumber || 'null'}`);
    logger.info(`- country: ${country || 'null'}`);
    logger.info(`- dateOfBirth: ${dateOfBirth || 'null'}`);
    logger.info(`- gender: ${gender || 'null'}`);
    logger.info(`- preferredLanguage: ${preferredLanguage || 'English'}`);
    logger.info(`- emergencyContactName: ${emergencyContactName || 'null'}`);
    logger.info(`- emergencyContactPhone: ${emergencyContactPhone || 'null'}`);
    logger.info(`- profilePicture: ${profilePicturePath || 'null'}`);

    // Prepare travel preferences
    let formattedTravelPreferences = null;
    if (travelPreferences) {
      try {
        if (typeof travelPreferences === 'string') {
          // If it's already a JSON string, validate it
          if (travelPreferences.startsWith('[')) {
            // Validate JSON format
            JSON.parse(travelPreferences);
            formattedTravelPreferences = travelPreferences;
          } else {
            // Convert to JSON array
            formattedTravelPreferences = JSON.stringify([travelPreferences]);
          }
        } else if (Array.isArray(travelPreferences)) {
          // Convert array to JSON string
          formattedTravelPreferences = JSON.stringify(travelPreferences);
        } else {
          // Convert other types to array with single item
          formattedTravelPreferences = JSON.stringify([travelPreferences]);
        }
        logger.info(`- travelPreferences (formatted): ${formattedTravelPreferences}`);
      } catch (error) {
        logger.error(`Error formatting travel preferences: ${error.message}`);
        throw new ApiError(400, 'Invalid travel preferences format');
      }
    }

    // Log the date of birth for debugging
   // Simple date of birth validation
if (dateOfBirth) {
  try {
    // Log the date of birth for debugging
    logger.info(`Validating date of birth: ${dateOfBirth}, type: ${typeof dateOfBirth}`);

    // Simple validation - just check if it's a valid date
    const validDate = new Date(dateOfBirth);

    if (isNaN(validDate.getTime())) {
      logger.error(`Invalid date detected: ${dateOfBirth}`);
      throw new ApiError(400, 'Invalid date. Please select a valid date.');
    }

    logger.info(`Date of birth validated: ${dateOfBirth}, parsed as: ${validDate.toISOString()}`);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error validating date: ${error.message}`);
    throw new ApiError(400, 'Invalid date. Please select a valid date using the date picker.');
  }
}

    // Execute query to register tourist with new schema
    const result = await executeQuery(`
      INSERT INTO Users (full_name, email, password, phone, role, profile_photo, created_at)
      VALUES (@name, @email, @password, @phoneNumber, 'traveler', @profilePicture, GETDATE());

      DECLARE @UserID INT = SCOPE_IDENTITY();

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
        updated_at,
        status
      )
      VALUES (
        @UserID,
        @name,
        @phoneNumber,
        @country,
        CASE
          WHEN @dateOfBirth IS NULL THEN NULL
          WHEN ISDATE(@dateOfBirth) = 1 THEN CONVERT(DATE, @dateOfBirth, 23) -- Format 23 is YYYY-MM-DD
          ELSE NULL
        END,
        @gender,
        @preferredLanguage,
        @emergencyContactName,
        @emergencyContactPhone,
        @profilePicture,
        @travelPreferences,
        GETDATE(),
        GETDATE(),
        'Active'
      );

      SELECT @UserID AS user_id, SCOPE_IDENTITY() AS tourist_id;
    `, {
      email,
      password: hashedPassword,
      name,
      phoneNumber: phoneNumber ? String(phoneNumber).substring(0, 15) : null,
      country: country || null,
      // Date of birth is already formatted as YYYY-MM-DD string
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      preferredLanguage: preferredLanguage || 'English',
      emergencyContactName: emergencyContactName || null,
      emergencyContactPhone: emergencyContactPhone ? String(emergencyContactPhone).substring(0, 20) : null,
      // Add profile picture path
      profilePicture: profilePicturePath,
      // Use the formatted travel preferences
      travelPreferences: formattedTravelPreferences
    });

    if (!result.recordset || !result.recordset[0]) {
      throw new ApiError(500, 'Failed to register tourist');
    }

    const userId = result.recordset[0].user_id;
    const touristId = result.recordset[0].tourist_id;

    // Create verification token and send verification email
    const verificationToken = await verificationService.createVerification(userId);
    await verificationService.sendVerificationEmail(email, name, verificationToken);

    logger.info(`Tourist registered successfully: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Tourist registered successfully. Please check your email to verify your account.',
      data: {
        touristId: touristId,
        email: email,
        verified: false
      }
    });
  } catch (error) {
    logger.error(`Error registering tourist: ${error.message}`);
    logger.error(`Error details: ${JSON.stringify(error)}`);

    // Handle specific SQL Server errors
    if (error.originalError && error.originalError.info) {
      logger.error(`SQL Error info: ${JSON.stringify(error.originalError.info)}`);
    }

    if (error.message.includes('Invalid SQL data type') ||
        error.message.includes('Error converting data type') ||
        error.message.includes('String or binary data would be truncated')) {

      // Log the request body for debugging
      logger.error(`Request body: ${JSON.stringify(req.body)}`);
      logger.error(`SQL Error details: ${error.message}`);

      // Check if it's specifically a date format error
      if (error.message.includes('date') || error.message.includes('datetime') || error.message.includes('convert')) {
        logger.error(`Date format error detected: ${error.message}`);
        throw new ApiError(400, 'Invalid date. Please select a valid date using the date picker.');
      }

      // Check if it's a phone number error
      if (error.message.includes('phone')) {
        logger.error(`Phone number error detected: ${error.message}`);
        throw new ApiError(400, 'Invalid phone number format. Please enter only digits.');
      }

      // Check if it's an emergency contact error
      if (error.message.includes('emergency')) {
        logger.error(`Emergency contact error detected: ${error.message}`);
        throw new ApiError(400, 'Invalid emergency contact information. Please check your input.');
      }

      // // Return a more specific error message for other data type errors
      // throw new ApiError(400, 'Invalid data format. Please check your input and try again.');
    }

    throw error;
  }
});

/**
 * Register a new driver
 * @route POST /api/auth/register/driver
 */
const registerDriver = catchAsync(async (req, res) => {
  // Log the entire request body for debugging
  logger.info(`Full driver registration request body: ${JSON.stringify(req.body)}`);

  // Extract fields with support for both camelCase and snake_case
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phoneNumber = req.body.phoneNumber || req.body.phone_number;
  const licenseNumber = req.body.licenseNumber || req.body.license_number;
  const gender = req.body.gender;
  const dateOfBirth = req.body.dateOfBirth || req.body.date_of_birth;
  const nicNumber = req.body.nicNumber || req.body.nic_number;
  const licenseExpiryDate = req.body.licenseExpiryDate || req.body.license_expiry_date;

  // Log extracted fields for debugging
  logger.info(`Extracted fields:
    name: ${name},
    email: ${email},
    phoneNumber: ${phoneNumber},
    licenseNumber: ${licenseNumber},
    gender: ${gender},
    dateOfBirth: ${dateOfBirth},
    nicNumber: ${nicNumber},
    licenseExpiryDate: ${licenseExpiryDate}
  `);

  try {
    // Log the request files for debugging
    logger.info(`Request files: ${JSON.stringify(req.files || {})}`);
    logger.info(`Request file (single): ${JSON.stringify(req.file || {})}`);

    // Check if email already exists
    const emailCheckResult = await executeQuery(
      `SELECT user_id FROM Users WHERE email = @email`,
      { email }
    );

    if (emailCheckResult.recordset && emailCheckResult.recordset.length > 0) {
      throw new ApiError(400, 'Email already registered');
    }

    // Handle uploaded files
    let profilePicturePath = null;
    let nicFrontImagePath = null;
    let nicBackImagePath = null;
    let licenseFrontImagePath = null;
    let policeClearanceImagePath = null;

    // Process uploaded files
    if (req.files && Object.keys(req.files).length > 0) {
      logger.info(`Files uploaded: ${JSON.stringify(Object.keys(req.files))}`);

      // Handle multiple files - check both camelCase and snake_case field names
      // Profile picture
      if (req.files.profilePicture && req.files.profilePicture.length > 0) {
        profilePicturePath = req.files.profilePicture[0].path.replace(/\\/g, '/').split('uploads/')[1];
        logger.info(`Profile picture uploaded: ${profilePicturePath}`);
      } else if (req.files.profile_picture && req.files.profile_picture.length > 0) {
        profilePicturePath = req.files.profile_picture[0].path.replace(/\\/g, '/').split('uploads/')[1];
        logger.info(`Profile picture uploaded (snake_case): ${profilePicturePath}`);
      } else {
        logger.info('No profile picture found in request.files');
      }

      // NIC front image
      if (req.files.nicFrontImage && req.files.nicFrontImage.length > 0) {
        nicFrontImagePath = req.files.nicFrontImage[0].path.replace(/\\/g, '/').split('uploads/')[1];
        logger.info(`NIC front image uploaded: ${nicFrontImagePath}`);
      } else if (req.files.nic_front_image && req.files.nic_front_image.length > 0) {
        nicFrontImagePath = req.files.nic_front_image[0].path.replace(/\\/g, '/').split('uploads/')[1];
        logger.info(`NIC front image uploaded (snake_case): ${nicFrontImagePath}`);
      } else {
        logger.info('No NIC front image found in request.files');
      }

      // NIC back image
      if (req.files.nicBackImage && req.files.nicBackImage.length > 0) {
        nicBackImagePath = req.files.nicBackImage[0].path.replace(/\\/g, '/').split('uploads/')[1];
        logger.info(`NIC back image uploaded: ${nicBackImagePath}`);
      } else if (req.files.nic_back_image && req.files.nic_back_image.length > 0) {
        nicBackImagePath = req.files.nic_back_image[0].path.replace(/\\/g, '/').split('uploads/')[1];
        logger.info(`NIC back image uploaded (snake_case): ${nicBackImagePath}`);
      } else {
        logger.info('No NIC back image found in request.files');
      }

      // License front image
      if (req.files.licenseFrontImage && req.files.licenseFrontImage.length > 0) {
        licenseFrontImagePath = req.files.licenseFrontImage[0].path.replace(/\\/g, '/').split('uploads/')[1];
        logger.info(`License front image uploaded: ${licenseFrontImagePath}`);
      } else if (req.files.license_front_image && req.files.license_front_image.length > 0) {
        licenseFrontImagePath = req.files.license_front_image[0].path.replace(/\\/g, '/').split('uploads/')[1];
        logger.info(`License front image uploaded (snake_case): ${licenseFrontImagePath}`);
      } else {
        logger.info('No license front image found in request.files');
      }

      // Police clearance image
      if (req.files.policeClearanceImage && req.files.policeClearanceImage.length > 0) {
        policeClearanceImagePath = req.files.policeClearanceImage[0].path.replace(/\\/g, '/').split('uploads/')[1];
        logger.info(`Police clearance image uploaded: ${policeClearanceImagePath}`);
      } else if (req.files.police_clearance_image && req.files.police_clearance_image.length > 0) {
        policeClearanceImagePath = req.files.police_clearance_image[0].path.replace(/\\/g, '/').split('uploads/')[1];
        logger.info(`Police clearance image uploaded (snake_case): ${policeClearanceImagePath}`);
      } else {
        logger.info('No police clearance image found in request.files');
      }
    } else if (req.file) {
      // Handle single file upload (backward compatibility)
      profilePicturePath = req.file.path.replace(/\\/g, '/').split('uploads/')[1];
      logger.info(`Single file uploaded (profile picture): ${profilePicturePath}`);
    } else {
      logger.info('No files uploaded in the request');

      // Check if this is a multipart form but files weren't properly parsed
      if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        logger.warn('Request has multipart/form-data content type but no files were parsed');
        logger.warn('This might indicate a mismatch between form field names and expected field names');

        // Log all form field names for debugging
        logger.warn(`Form field names: ${JSON.stringify(Object.keys(req.body))}`);
      }
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Log the parameters for debugging
    logger.info(`Registering driver with parameters: ${JSON.stringify({
      email,
      name,
      phoneNumber: phoneNumber || null,
      licenseNumber,
      gender: gender || null,
      dateOfBirth: dateOfBirth || null,
      licenseExpiryDate: licenseExpiryDate || null,
      nicNumber: nicNumber || null,
      hasProfilePicture: !!profilePicturePath,
      hasNicFrontImage: !!nicFrontImagePath,
      hasNicBackImage: !!nicBackImagePath,
      hasLicenseFrontImage: !!licenseFrontImagePath,
      hasPoliceClearanceImage: !!policeClearanceImagePath
    })}`);

    // Validate required fields according to the database schema
    if (!phoneNumber) {
      throw new ApiError(400, 'Phone number is required');
    }

    if (!nicNumber) {
      throw new ApiError(400, 'NIC number is required');
    }

    if (!licenseNumber) {
      throw new ApiError(400, 'License number is required');
    }

    // Validate required images
    if (!nicFrontImagePath) {
      throw new ApiError(400, 'NIC front image is required');
    }

    if (!nicBackImagePath) {
      throw new ApiError(400, 'NIC back image is required');
    }

    if (!licenseFrontImagePath) {
      throw new ApiError(400, 'License front image is required');
    }

    // Format date of birth properly for SQL Server
    let formattedDateOfBirth = null;
    if (dateOfBirth) {
      try {
        // Log the original date format
        logger.info(`Original date of birth: ${dateOfBirth}`);

        // Check if the date is already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
          formattedDateOfBirth = dateOfBirth;
        } else {
          // Ensure date is in SQL Server compatible format (YYYY-MM-DD)
          const date = new Date(dateOfBirth);

          // Check if the date is valid
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }

          formattedDateOfBirth = date.toISOString().split('T')[0];
        }
      } catch (error) {
        logger.error(`Error formatting date of birth: ${error.message}`);
        throw new ApiError(400, 'Invalid date format for date of birth. Please use YYYY-MM-DD format.');
      }
    }

    // Format license expiry date properly for SQL Server
    let formattedLicenseExpiryDate = null;
    if (licenseExpiryDate) {
      try {
        // Log the original date format
        logger.info(`Original license expiry date: ${licenseExpiryDate}`);

        // Check if the date is already in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(licenseExpiryDate)) {
          formattedLicenseExpiryDate = licenseExpiryDate;
        } else {
          // Ensure date is in SQL Server compatible format (YYYY-MM-DD)
          const date = new Date(licenseExpiryDate);

          // Check if the date is valid
          if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
          }

          formattedLicenseExpiryDate = date.toISOString().split('T')[0];
        }
      } catch (error) {
        logger.error(`Error formatting license expiry date: ${error.message}`);
        throw new ApiError(400, 'Invalid date format for license expiry date. Please use YYYY-MM-DD format.');
      }
    } else {
      // Default to 5 years from now if not provided
      const defaultExpiryDate = new Date();
      defaultExpiryDate.setFullYear(defaultExpiryDate.getFullYear() + 5);
      formattedLicenseExpiryDate = defaultExpiryDate.toISOString().split('T')[0];
    }

    logger.info(`Formatted date of birth: ${formattedDateOfBirth}`);
    logger.info(`Formatted license expiry date: ${formattedLicenseExpiryDate}`);

    // Default image path if not provided
    const defaultImagePath = 'default-profile.jpg';

    // Log all image paths for debugging
    logger.info(`Profile picture path: ${profilePicturePath || 'null'}`);
    logger.info(`NIC front image path: ${nicFrontImagePath || 'null'}`);
    logger.info(`NIC back image path: ${nicBackImagePath || 'null'}`);
    logger.info(`License front image path: ${licenseFrontImagePath || 'null'}`);
    logger.info(`Police clearance image path: ${policeClearanceImagePath || 'null'}`);

    // Use the profile picture for the user table, or default if not provided
    const userProfilePic = profilePicturePath || defaultImagePath;

    // Log the final profile picture path that will be used
    logger.info(`Final profile picture path to be used: ${userProfilePic}`);

    // Execute query to register driver with new schema using a transaction for consistency
    const result = await executeQuery(`
      -- Start a transaction to ensure data consistency
      BEGIN TRY
        BEGIN TRANSACTION;

        -- Insert into Users table with profile photo
        INSERT INTO Users (full_name, email, password, phone, role, profile_photo, created_at)
        VALUES (@name, @email, @password, @phoneNumber, 'driver', @userProfilePic, GETDATE());

        -- Get the user ID
        DECLARE @UserID INT = SCOPE_IDENTITY();

        -- Log the user ID for debugging
        PRINT 'User ID created: ' + CAST(@UserID AS VARCHAR);

        -- Insert into Drivers table with the same profile picture
        INSERT INTO Drivers (
          user_id,
          full_name,
          phone_number,
          gender,
          date_of_birth,
          nic_number,
          nic_front_image,
          nic_back_image,
          profile_picture,
          license_number,
          license_front_image,
          license_expiry_date,
          police_clearance_image,
          status,
          registration_date,
          updated_at
        )
        VALUES (
          @UserID,
          @name,
          @phoneNumber,
          @gender,
          @dateOfBirth,
          @nicNumber,
          @nicFrontImage,
          @nicBackImage,
          @userProfilePic, -- Use the same profile picture in both tables
          @licenseNumber,
          @licenseFrontImage,
          @licenseExpiryDate,
          @policeClearanceImage,
          'Pending',
          GETDATE(),
          GETDATE()
        );

        -- Verify the profile picture was set correctly in both tables
        PRINT 'Verifying profile picture in Users table...';
        SELECT profile_photo FROM Users WHERE user_id = @UserID;

        PRINT 'Verifying profile picture in Drivers table...';
        SELECT profile_picture FROM Drivers WHERE user_id = @UserID;

        -- If we got here, commit the transaction
        COMMIT TRANSACTION;

        -- Return the IDs
        SELECT @UserID AS user_id, (SELECT driver_id FROM Drivers WHERE user_id = @UserID) AS driver_id;
      END TRY
      BEGIN CATCH
        -- If there was an error, roll back the transaction
        IF @@TRANCOUNT > 0
          ROLLBACK TRANSACTION;

        -- Log the error
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        PRINT 'Error in driver registration transaction: ' + @ErrorMessage;

        -- Re-throw the error to be caught by the catch block in the Node.js code
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
      END CATCH;
    `, {
      email,
      password: hashedPassword,
      name,
      phoneNumber: String(phoneNumber).substring(0, 15),
      gender: gender || 'Not Specified',
      dateOfBirth: formattedDateOfBirth,
      nicNumber,
      nicFrontImage: nicFrontImagePath,
      nicBackImage: nicBackImagePath,
      userProfilePic: userProfilePic, // Use the same variable for both tables
      licenseNumber,
      licenseFrontImage: licenseFrontImagePath,
      licenseExpiryDate: formattedLicenseExpiryDate,
      policeClearanceImage: policeClearanceImagePath
    });

    if (!result.recordset || !result.recordset[0]) {
      throw new ApiError(500, 'Failed to register driver');
    }

    const userId = result.recordset[0].user_id;
    const driverId = result.recordset[0].driver_id;

    // Create verification token and send verification email
    const verificationToken = await verificationService.createVerification(userId);
    await verificationService.sendVerificationEmail(email, name, verificationToken);

    logger.info(`Driver registered successfully: ${email}`);

    res.status(201).json({
      success: true,
      message: 'Driver registered successfully. Please check your email to verify your account. After verification, your account will be pending approval by admin.',
      data: {
        driverId: driverId,
        email: email,
        verified: false
      }
    });
  } catch (error) {
    // Log the full error object for debugging
    logger.error(`Error registering driver: ${error.message}`);
    logger.error(`Error stack: ${error.stack}`);

    if (error.originalError) {
      logger.error(`Original error: ${JSON.stringify(error.originalError)}`);
    }

    // Check for specific error types and provide more helpful messages
    if (error instanceof ApiError) {
      // If it's already an ApiError, just rethrow it
      throw error;
    } else if (error.message.includes('Email already registered')) {
      // This is already a clear message, just rethrow it
      throw new ApiError(400, 'Email already registered. Please use a different email address or try to login.');
    } else if (error.message.includes('Invalid SQL data type')) {
      // Check if the user was actually created despite the error
      try {
        const userCheckResult = await executeQuery(
          `SELECT user_id FROM Users WHERE email = @email`,
          { email }
        );

        if (userCheckResult.recordset && userCheckResult.recordset.length > 0) {
          // User exists, so registration was actually successful
          logger.info(`User with email ${email} already exists in the database despite SQL data type error`);

          // Return success response instead of error
          return res.status(201).json({
            success: true,
            message: 'Driver registered successfully. Please check your email to verify your account. After verification, your account will be pending approval by admin.',
            data: {
              email: email,
              verified: false
            }
          });
        } else {
          // User doesn't exist, so it's a genuine error
          throw new ApiError(400, 'Invalid data format. Please check your input and try again.');
        }
      } catch (checkError) {
        // If we can't check, assume it's a genuine error
        logger.error(`Error checking if user exists after SQL data type error: ${checkError.message}`);
        throw new ApiError(400, 'Invalid data format. Please check your input and try again.');
      }
    } else if (error.message.includes('Cannot insert the value NULL')) {
      // Extract the column name from the error message if possible
      const columnMatch = error.message.match(/column '([^']+)'/);
      const columnName = columnMatch ? columnMatch[1] : 'a required field';

      // Map database column names to user-friendly names
      const columnNameMap = {
        'profile_picture': 'Profile Picture',
        'nic_front_image': 'NIC Front Image',
        'nic_back_image': 'NIC Back Image',
        'license_front_image': 'License Front Image',
        'police_clearance_image': 'Police Clearance Image',
        'full_name': 'Full Name',
        'phone_number': 'Phone Number',
        'gender': 'Gender',
        'date_of_birth': 'Date of Birth',
        'nic_number': 'NIC Number',
        'license_number': 'License Number',
        'license_expiry_date': 'License Expiry Date'
      };

      const friendlyColumnName = columnNameMap[columnName] || columnName;
      throw new ApiError(400, `${friendlyColumnName} is required. Please provide this information.`);
    } else if (error.message.includes('String or binary data would be truncated')) {
      throw new ApiError(400, 'One of your inputs exceeds the maximum allowed length. Please shorten your input and try again.');
    } else if (error.message.includes('Violation of UNIQUE KEY constraint')) {
      throw new ApiError(400, 'A record with this information already exists. Please check your inputs for duplicates.');
    } else if (error.message.includes('Conversion failed')) {
      throw new ApiError(400, 'Invalid data format. Please ensure all fields have the correct format (e.g., dates, numbers).');
    } else if (error.message.includes('Invalid date format')) {
      throw new ApiError(400, 'Invalid date format. Please enter a valid date in the format YYYY-MM-DD.');
    } else if (error.message.includes('multipart/form-data')) {
      throw new ApiError(400, 'Invalid form data format. Please ensure all required files are properly uploaded.');
    } else {
      // For any other database errors, provide a generic message but include the original error for debugging
      logger.error(`Unhandled error during driver registration: ${error.message}`);
      throw new ApiError(500, 'An error occurred while registering. Please try again later or contact support.');
    }
  }
});

/**
 * Login a user
 * @route POST /api/auth/login
 */
const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Log the login attempt
  logger.info(`Login attempt for email: ${email}`);

  // Get user from database with updated schema - simplified query to avoid column name issues
  const query = `
    SELECT
      U.user_id,
      U.email,
      U.password,
      U.role,
      U.full_name
    FROM Users U
    WHERE U.email = @email
  `;

  logger.info(`Executing login query for email: ${email}`);

  let user;

  try {
    // First, perform a simple database connection test
    try {
      logger.info('Testing database connection before login...');
      const testQuery = 'SELECT 1 AS connection_test';
      const testResult = await executeQuery(testQuery, {});

      if (testResult && testResult.recordset && testResult.recordset[0].connection_test === 1) {
        logger.info('Database connection test successful');
      } else {
        logger.error('Database connection test failed with unexpected result');
        throw new ApiError(500, 'Database connection error: Unable to verify database connectivity');
      }
    } catch (connectionError) {
      logger.error(`Database connection test failed: ${connectionError.message}`);
      logger.error(`Error stack: ${connectionError.stack || 'No stack trace available'}`);
      throw new ApiError(500, 'Database connection error: Unable to connect to the database. Please try again later.');
    }

    // Now execute the actual login query
    logger.info(`Executing login query for email: ${email} after successful connection test`);
    const result = await executeQuery(query, { email });

    if (!result.recordset || result.recordset.length === 0) {
      logger.warn(`No user found with email: ${email}`);
      throw new ApiError(401, 'Invalid credentials');
    }

    user = result.recordset[0];
    logger.info(`User found: ${JSON.stringify({
      userId: user.user_id,
      email: user.email,
      role: user.role
    })}`);

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn(`Password mismatch for user: ${user.email}`);
      throw new ApiError(401, 'Invalid credentials');
    }

    logger.info(`Password verified for user: ${user.email}`);
  } catch (error) {
    logger.error(`Database error during login: ${error.message}`);
    logger.error(`Error stack: ${error.stack || 'No stack trace available'}`);

    // Check if it's a database connection error
    if (error.message.includes('database') ||
        error.message.includes('sql') ||
        error.message.includes('connection') ||
        error.message.includes('DSN') ||
        error.message.includes('driver')) {
      throw new ApiError(500, 'Database connection error: ' + error.message);
    }

    // If it's already an ApiError, just rethrow it
    if (error instanceof ApiError) {
      throw error;
    }

    // For other errors, provide a generic message
    throw new ApiError(500, 'An error occurred during login. Please try again later.');
  }

  // Check if email is verified for both travelers and drivers
  if (user.role === 'traveler' || user.role === 'driver') {
    const verificationQuery = `
      SELECT is_verified
      FROM EmailVerification
      WHERE user_id = @userId
    `;

    const verificationResult = await executeQuery(verificationQuery, { userId: user.user_id });

    if (!verificationResult.recordset ||
        verificationResult.recordset.length === 0 ||
        !verificationResult.recordset[0].is_verified) {

      // If not verified, send a new verification email
      const verificationToken = await verificationService.createVerification(user.user_id);
      await verificationService.sendVerificationEmail(user.email, user.full_name, verificationToken);

      throw new ApiError(403, 'Email not verified. A new verification email has been sent to your email address.');
    }
  }

  // Check if driver account is pending approval
  if (user.role === 'driver') {
    const driverStatusQuery = `
      SELECT status
      FROM Drivers
      WHERE user_id = @userId
    `;

    const driverStatusResult = await executeQuery(driverStatusQuery, { userId: user.user_id });

    if (driverStatusResult.recordset &&
        driverStatusResult.recordset.length > 0 &&
        driverStatusResult.recordset[0].status === 'Pending') {
      throw new ApiError(403, 'Your account is pending approval by admin.');
    }
  }

  // Try to update last login timestamp if the column exists
  try {
    await executeQuery(`
      IF COL_LENGTH('Users', 'last_login_at') IS NOT NULL
      BEGIN
        UPDATE Users SET last_login_at = GETDATE() WHERE user_id = @userId
      END
    `, { userId: user.user_id });
  } catch (updateError) {
    // Log the error but don't fail the login process
    logger.warn(`Could not update last_login_at: ${updateError.message}`);
  }

  // Generate token
  const token = generateToken({
    UserID: user.user_id,
    Role: user.role
  });

  const refreshToken = generateRefreshToken({
    UserID: user.user_id,
    Role: user.role
  });

  logger.info(`User logged in: ${email}`);

  // Return user info and token - simplified response
  res.json({
    success: true,
    data: {
      userId: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      token,
      refreshToken
    }
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
const getCurrentUser = catchAsync(async (req, res) => {
  // User is already attached to request by the auth middleware
  const { user } = req;

  // Remove sensitive information
  delete user.Password;

  res.json({
    success: true,
    data: user
  });
});

/**
 * Refresh JWT token
 * @route POST /api/auth/refresh-token
 */
const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    throw new ApiError(400, 'Refresh token is required');
  }

  try {
    // Verify refresh token
    const decoded = verifyToken(token);

    if (!decoded || decoded.tokenType !== 'refresh') {
      throw new ApiError(401, 'Invalid refresh token');
    }

    // Get user from database with updated schema
    const query = `
      SELECT
        U.user_id,
        U.email,
        U.role,
        U.full_name,
        CASE
          WHEN U.role = 'traveler' THEN T.tourist_id
          WHEN U.role = 'driver' THEN D.driver_id
          WHEN U.role = 'admin' THEN NULL
          ELSE NULL
        END AS role_id
      FROM Users U
      LEFT JOIN Tourists T ON U.user_id = T.user_id AND U.role = 'traveler'
      LEFT JOIN Drivers D ON U.user_id = D.user_id AND U.role = 'driver'
      WHERE U.user_id = @userId
    `;

    const result = await executeQuery(query, { userId: decoded.userId });

    if (!result.recordset || !result.recordset[0]) {
      throw new ApiError(401, 'User not found');
    }

    const user = result.recordset[0];

    // Generate new tokens
    const newToken = generateToken({
      UserID: user.user_id,
      Role: user.role
    });

    const newRefreshToken = generateRefreshToken({
      UserID: user.user_id,
      Role: user.role
    });

    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Refresh token expired');
    }
    throw error;
  }
});

/**
 * Logout user (client side token removal)
 * @route POST /api/auth/logout
 */
const logout = catchAsync(async (_, res) => {
  // JWT is stateless - no server-side logout needed
  // Client should remove token

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

/**
 * Verify email with token
 * @route GET /api/auth/verify-email
 */
const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;

  if (!token) {
    throw new ApiError(400, 'Verification token is required');
  }

  const result = await verificationService.verifyEmail(token);

  if (!result.success) {
    throw new ApiError(400, result.message);
  }

  res.json({
    success: true,
    message: result.message,
    data: {
      userId: result.user.userId,
      email: result.user.email
    }
  });
});

/**
 * Resend verification email
 * @route POST /api/auth/resend-verification
 */
const resendVerification = catchAsync(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  // Find user by email
  const userQuery = `
    SELECT user_id, full_name, email
    FROM Users
    WHERE email = @email
  `;

  const userResult = await executeQuery(userQuery, { email });

  if (!userResult.recordset || userResult.recordset.length === 0) {
    throw new ApiError(404, 'User not found');
  }

  const user = userResult.recordset[0];

  // Check if already verified
  const verificationQuery = `
    SELECT is_verified
    FROM EmailVerification
    WHERE user_id = @userId
  `;

  const verificationResult = await executeQuery(verificationQuery, { userId: user.user_id });

  if (verificationResult.recordset &&
      verificationResult.recordset.length > 0 &&
      verificationResult.recordset[0].is_verified) {
    throw new ApiError(400, 'Email already verified');
  }

  // Create new verification token and send email
  const verificationToken = await verificationService.createVerification(user.user_id);
  await verificationService.sendVerificationEmail(user.email, user.full_name, verificationToken);

  res.json({
    success: true,
    message: 'Verification email sent successfully'
  });
});

module.exports = {
  registerTourist,
  registerDriver,
  login,
  getCurrentUser,
  refreshToken,
  logout,
  verifyEmail,
  resendVerification
};