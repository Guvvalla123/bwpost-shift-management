// handleErrors.js
// This catches ALL errors in the application
// and sends a proper error response.
//
// Express knows this is an error handler
// because it has 4 parameters (err, req, res, next)
// Regular middleware only has 3 (req, res, next)
//
// This MUST be added after all routes in server.js
// When any controller throws an error
// Express skips all regular middleware and
// sends the error directly here.
//
// TYPES OF ERRORS HANDLED:
// Mongoose validation error - 400 Bad Request
// MongoDB duplicate key - 409 Conflict
// JWT invalid error - 401 Unauthorized
// JWT expired error - 401 Unauthorized
// Everything else - 500 Server Error

const { sendError } = require("../helpers/sendResponse");

// handleErrors - processes all app errors
// err - the error that was thrown
// req - the request object
// res - the response object
// next - required by Express (even if unused)
function handleErrors(err, req, res, next) {
  // Log the error in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.log("ERROR:", err);
  }

  // Mongoose validation error
  // Happens when required field is missing
  if (err.name === "ValidationError") {
    return sendError(res, 400, err.message);
  }

  // MongoDB duplicate key error
  // Happens when email already exists
  if (err.code === 11000) {
    return sendError(res, 409, "This record already exists");
  }

  // JWT invalid error
  // Happens when token is wrong
  if (err.name === "JsonWebTokenError") {
    return sendError(res, 401, "Invalid token");
  }

  // JWT expired error
  // Happens when token is too old
  if (err.name === "TokenExpiredError") {
    return sendError(res, 401, "Token has expired");
  }

  // Default error for anything else
  return sendError(res, 500, "Something went wrong");
}

module.exports = handleErrors;
