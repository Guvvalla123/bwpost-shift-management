const AppError = require("../utils/AppError");

/**
 * Single exit point for API errors — same envelope as sendError().
 */
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
    message = err.message || "Internal Server Error";
  }

  if (statusCode >= 500) {
    console.error("Server Error:", err);
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
