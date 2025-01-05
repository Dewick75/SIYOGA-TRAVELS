// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ApiError } = require('../utils/errorHandler');
const config = require('../config/config');
const logger = require('../config/logger');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../../', config.upload.destination || 'uploads');
const profilePicsDir = path.join(uploadDir, 'profile-pictures');
const vehicleImagesDir = path.join(uploadDir, 'vehicle-images');
const destinationImagesDir = path.join(uploadDir, 'destination-images');
const driverDocsDir = path.join(uploadDir, 'driver-documents');

// Create all required directories if they don't exist
const createDirIfNotExists = (dirPath) => {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`Directory created: ${dirPath}`);
    }
  } catch (error) {
    logger.error(`Error creating directory ${dirPath}: ${error.message}`);
    throw new ApiError(500, 'Failed to create upload directory');
  }
};

// Create all necessary directories
createDirIfNotExists(uploadDir);
createDirIfNotExists(profilePicsDir);
createDirIfNotExists(vehicleImagesDir);
createDirIfNotExists(destinationImagesDir);
createDirIfNotExists(driverDocsDir);

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the correct folder based on file field name
    // Support both camelCase and snake_case field names
    const fieldname = file.fieldname.toLowerCase();

    if (fieldname === 'profilepicture' || fieldname === 'profile_picture') {
      cb(null, profilePicsDir);
    }
    else if (fieldname === 'vehicleimage' || fieldname === 'vehicle_image') {
      cb(null, vehicleImagesDir);
    }
    else if (fieldname === 'destinationimage' || fieldname === 'destination_image') {
      cb(null, destinationImagesDir);
    }
    else if (
      fieldname === 'nicfrontimage' || fieldname === 'nic_front_image' ||
      fieldname === 'nicbackimage' || fieldname === 'nic_back_image' ||
      fieldname === 'licensefrontimage' || fieldname === 'license_front_image' ||
      fieldname === 'policeclearanceimage' || fieldname === 'police_clearance_image'
    ) {
      cb(null, driverDocsDir);
    }
    else {
      cb(null, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomNumber-originalNameWithoutSpaces
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const sanitizedName = path.basename(file.originalname, extension)
      .replace(/\s+/g, '-')  // Replace spaces with hyphens
      .replace(/[^a-zA-Z0-9-_]/g, ''); // Remove special characters

    // Create filename with original name (without spaces) for better identification
    const filename = `${uniqueSuffix}-${sanitizedName}${extension}`;

    // Log the filename for debugging
    logger.info(`Generating filename for upload: ${filename}`);

    cb(null, filename);
  }
});

// File filter for allowed file types
const fileFilter = (req, file, cb) => {
  // Define allowed image types
  const allowedImageTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  // Define allowed document types
  const allowedDocumentTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // For profile pictures - support both camelCase and snake_case
  const fieldname = file.fieldname.toLowerCase();

  if (fieldname === 'profilepicture' || fieldname === 'profile_picture') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `Profile picture must be an image. Allowed types: ${allowedImageTypes.join(', ')}`), false);
    }
  }
  // For vehicle images
  else if (fieldname === 'vehicleimage' || fieldname === 'vehicle_image') {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `Vehicle image must be an image. Allowed types: ${allowedImageTypes.join(', ')}`), false);
    }
  }
  // For driver documents (NIC, license, etc.) - support both camelCase and snake_case
  else if ([
    'nicFrontImage', 'nic_front_image',
    'nicBackImage', 'nic_back_image',
    'licenseFrontImage', 'license_front_image',
    'policeClearanceImage', 'police_clearance_image'
  ].includes(file.fieldname)) {
    if (allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `Document image must be an image. Allowed types: ${allowedImageTypes.join(', ')}`), false);
    }
  }
  // For other file types
  else {
    const allowedMimeTypes = [
      ...allowedImageTypes,
      ...allowedDocumentTypes,
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new ApiError(400, `File type not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`), false);
    }
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize || 5 * 1024 * 1024 // Default to 5MB if not specified
  }
});

// Create fields configuration for driver registration
const driverFields = [
  { name: 'profilePicture', maxCount: 1 },
  { name: 'nicFrontImage', maxCount: 1 },
  { name: 'nicBackImage', maxCount: 1 },
  { name: 'licenseFrontImage', maxCount: 1 },
  { name: 'policeClearanceImage', maxCount: 1 }
];

// Export functions and paths
module.exports = {
  upload,
  uploadDir,
  profilePicsDir,
  vehicleImagesDir,
  destinationImagesDir,
  driverDocsDir,
  driverFields
};