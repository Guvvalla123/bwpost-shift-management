// AppError.js
// Custom error class for the application.
//
// When something goes wrong in a controller
// we throw an AppError instead of a generic
// JavaScript error.
//
// Example usage:
// if (!user) {
//   throw new AppError("User not found", 404);
// }
//
// The error middleware catches this and
// sends the right status code and message
// back to the frontend automatically.

// AppError - extends the built-in Error class with a statusCode
// message - the error message shown to the client
// statusCode - the HTTP status code to send (400, 401, 403, 404, 500, etc.)
// data - optional extra data to include in the error response
//        example: Joi validation errors as an array
class AppError extends Error {
  constructor(message, statusCode = 500, data) {
    super(message);
    this.statusCode = statusCode;
    // isOperational means this is an expected error we threw on purpose
    // not a surprise crash from a bug
    this.isOperational = true;
    if (data !== undefined) this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
