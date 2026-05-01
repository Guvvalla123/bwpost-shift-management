// sendResponse.js
// Helper functions to send consistent
// API responses to the frontend.
//
// Every success response looks like:
// { success: true, message: "...", data: {...} }
//
// Every error response looks like:
// { success: false, message: "..." }
//
// Using consistent format means the frontend
// always knows what to expect from the API.

// sendSuccess - sends a success response
// res - Express response object
// statusCode - HTTP status code (200, 201 etc)
// message - success message string
// data - the data to send back (optional)
function sendSuccess(res, statusCode, message, data) {
  res.status(statusCode).json({
    success: true,
    message: message,
    data: data,
  });
}

// sendError - sends an error response
// res - Express response object
// statusCode - HTTP status code (400, 401 etc)
// message - error message to show user
function sendError(res, statusCode, message) {
  res.status(statusCode).json({
    success: false,
    message: message,
  });
}

module.exports = { sendSuccess, sendError };
