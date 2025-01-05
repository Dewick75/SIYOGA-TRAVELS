// src/middleware/validator.js
const { ApiError } = require('../utils/errorHandler');

/**
 * Basic validation middleware
 * @param {Function} validationSchema - The validation function to use
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      // Simple validation function
      // In a real app, you'd use a library like Joi
      const errors = [];
      
      // Check each field in the schema
      for (const [field, rules] of Object.entries(schema)) {
        const value = req.body[field];
        
        // Required check
        if (rules.required && (value === undefined || value === null || value === '')) {
          errors.push(`${field} is required`);
          continue;
        }
        
        // Skip other validations if value is not provided and not required
        if ((value === undefined || value === null || value === '') && !rules.required) {
          continue;
        }
        
        // Minimum length check
        if (rules.minLength && value.length < rules.minLength) {
          errors.push(`${field} must be at least ${rules.minLength} characters`);
        }
        
        // Maximum length check
        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push(`${field} must be less than ${rules.maxLength} characters`);
        }
        
        // Pattern check
        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push(`${field} is not in a valid format`);
        }
        
        // Type check
        if (rules.type && typeof value !== rules.type) {
          errors.push(`${field} must be a ${rules.type}`);
        }
        
        // Minimum value check
        if (rules.min !== undefined && value < rules.min) {
          errors.push(`${field} must be at least ${rules.min}`);
        }
        
        // Maximum value check
        if (rules.max !== undefined && value > rules.max) {
          errors.push(`${field} must be less than ${rules.max}`);
        }
        
        // Custom validation
        if (rules.validate && !rules.validate(value)) {
          errors.push(rules.message || `${field} is invalid`);
        }
      }
      
      if (errors.length > 0) {
        throw new ApiError(400, errors.join(', '));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = {
  validate
};