// src/utils/catchAsync.js
/**
 * Function to handle errors in async route handlers
 * @param {Function} fn - The async function to wrap
 * @returns {Function} - The wrapped function
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

module.exports = catchAsync;
