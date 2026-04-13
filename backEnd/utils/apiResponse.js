/**
 * Standard JSON envelope for all HTTP API responses.
 *
 * Success: { success: true, data?: any, message?: string }
 * Failure: { success: false, error: string, message?: string, data?: any }
 */

function sendSuccess(res, statusCode, options = {}) {
  const { data, message, pagination } = options;
  const body = { success: true };
  if (data !== undefined) body.data = data;
  if (message !== undefined && message !== "") body.message = message;
  if (pagination !== undefined) body.pagination = pagination;
  return res.status(statusCode).json(body);
}

function sendError(res, statusCode, error, options = {}) {
  const msg =
    typeof error === "string"
      ? error
      : error?.message || "Request failed";
  const body = { success: false, error: msg };
  if (options.message) body.message = options.message;
  if (options.data !== undefined) body.data = options.data;
  return res.status(statusCode).json(body);
}

module.exports = { sendSuccess, sendError };
