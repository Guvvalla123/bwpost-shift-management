// errorMiddleware.js
// This middleware catches ALL errors that
// happen anywhere in the application and
// sends a proper error response.
//
// HOW IT WORKS:
// When any controller throws an error
// Express automatically sends it here.
// We look at what type of error it is
// and send the right status code and
// message back to the frontend.
//
// Error types we handle:
//
// Validation Error (400):
//   Happens when request data is invalid
//   Example: email field is empty
//
// JWT Error (401):
//   Happens when token is invalid
//   Example: token was tampered with
//
// Token Expired Error (401):
//   Happens when token is too old
//   Frontend will try to refresh token
//
// Cast Error (400):
//   Happens when MongoDB ID is invalid
//   Example: invalid ObjectId format
//
// Duplicate Key Error (409):
//   Happens when unique field already exists
//   Example: email already registered
//
// AppError (custom):
//   Errors we throw manually in controllers
//   Example: throw new AppError("Not found", 404)
//
// Unknown Error (500):
//   Unexpected errors we did not anticipate

const AppError = require("../helpers/AppError");

// errorHandler - the main error handling function
// Express recognises this as an error handler because it has 4 parameters
// err - the error that was thrown
// req - the Express request object
// res - the Express response object
// next - the next middleware function (required by Express even if unused)
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal Server Error";

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === "ValidationError" && err.errors) {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid ID format";
  } else if (err.code === 11000) {
    statusCode = 409;
    message = "Duplicate value";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  } else {
    statusCode = err.statusCode || 500;
    if (statusCode === 500 && process.env.NODE_ENV === "production") {
      message = "An unexpected error occurred";
    } else {
      message = err.message || "Internal Server Error";
    }
  }

  if (statusCode >= 500) {
    console.error("Server Error:", req.id || "-", err.message);
  }

  const body = { success: false, error: message };
  const data = {};
  if (err instanceof AppError && err.data != null && typeof err.data === "object") {
    Object.assign(data, err.data);
  }
  if (process.env.NODE_ENV === "development" && err.stack) {
    data.stack = err.stack;
  }
  if (Object.keys(data).length) body.data = data;

  res.status(statusCode).json(body);
};

module.exports = errorHandler;
