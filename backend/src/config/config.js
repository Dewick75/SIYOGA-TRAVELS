// // src/config/config.js
// require('dotenv').config();

// const config = {
//   // Server configuration
//   port: process.env.PORT || 3000,
//   nodeEnv: process.env.NODE_ENV || 'development',

//   // JWT configuration
//   jwt: {
//     secret: process.env.JWT_SECRET || 'your-secret-key',
//     expiresIn: process.env.JWT_EXPIRES_IN || '1d'
//   },

//   // Email configuration
//   email: {
//     service: process.env.EMAIL_SERVICE || 'gmail',
//     user: process.env.EMAIL_USER,
//     password: process.env.EMAIL_PASSWORD,
//     from: process.env.EMAIL_FROM || 'noreply@siyogatravels.com'
//   },

//   // Payment gateway configuration (e.g., Stripe)
//   payment: {
//     stripeSecretKey: process.env.STRIPE_SECRET_KEY,
//     stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
//     currency: process.env.PAYMENT_CURRENCY || 'lkr'
//   },

//   // CORS allowed origins
//   corsOrigins: process.env.CORS_ORIGINS
//     ? process.env.CORS_ORIGINS.split(',')
//     : ['http://localhost:5173'],

//   // File upload configuration
//   upload: {
//     destination: process.env.UPLOAD_DESTINATION || 'uploads/',
//     maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880') // 5MB in bytes
//   }
// };

// module.exports = config;



// src/config/config.js
require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 9876, // Changed to use port 9876
  nodeEnv: process.env.NODE_ENV || 'development',

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'siyoga_travels_secret_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },

  // Email configuration
  email: {
    service: process.env.EMAIL_SERVICE || 'gmail',
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    from: process.env.EMAIL_FROM || 'noreply@siyogatravels.com'
  },

  // Payment gateway configuration (e.g., Stripe)
  payment: {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublicKey: process.env.STRIPE_PUBLIC_KEY,
    currency: process.env.PAYMENT_CURRENCY || 'lkr'
  },

  // CORS allowed origins
  corsOrigins: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:5173'],

  // File upload configuration
  upload: {
    destination: process.env.UPLOAD_DESTINATION || 'uploads/',
    maxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880') // 5MB in bytes
  }
};

module.exports = config;