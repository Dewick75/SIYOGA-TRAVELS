// src/routes/upload.routes.js
const express = require('express');
const router = express.Router();
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const logger = require('../config/logger');
const config = require('../config/config');

// Base upload directory
const uploadDir = path.join(__dirname, '../../', config.upload.destination || 'uploads');

// Serve static files from the uploads directory
router.get('/:folder/:filename', (req, res) => {
  const { folder, filename } = req.params;

  // Validate folder to prevent directory traversal
  const allowedFolders = ['profile-pictures', 'vehicle-images', 'destination-images', 'driver-documents'];

  if (!allowedFolders.includes(folder)) {
    return res.status(404).send('Not found');
  }

  // Construct the file path
  const filePath = path.join(uploadDir, folder, filename);

  // Send the file
  res.sendFile(filePath, (err) => {
    if (err) {
      logger.error(`Error serving file ${filePath}: ${err.message}`);

      // Don't expose the full path in the error message
      if (err.code === 'ENOENT') {
        return res.status(404).send('File not found');
      }

      res.status(500).send('Error serving file');
    }
  });
});

// Upload destination image (admin only)
router.post('/destination-image', authenticate, authorize('Admin'), upload.upload.single('destinationImage'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Get just the filename
    const filename = req.file.filename;

    // Return the relative path to the file
    const filePath = `destination-images/${filename}`;

    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename,
        path: filePath,
        url: `/api/uploads/${filePath}`
      }
    });
  } catch (error) {
    logger.error(`Error uploading destination image: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

module.exports = router;
