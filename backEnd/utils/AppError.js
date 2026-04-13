/**
 * Operational errors — passed to Express via next(err); handled by errorHandler.
 * Optional `data` is merged into the JSON body (e.g. Joi field errors).
 */
class AppError extends Error {
  constructor(message, statusCode = 500, data) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (data !== undefined) this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
