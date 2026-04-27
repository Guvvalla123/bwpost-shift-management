// sendResponse.js
// Helper functions to send consistent
// API responses to the frontend.
//
// Every API response has the same format
// so the frontend always knows what to expect.
//
// Success response format:
// {
//   success: true,
//   message: "Login successful",
//   data: { user: {...} }
// }
//
// Error response format:
// {
//   success: false,
//   message: "Email not found"
// }

// sendSuccess - sends a successful response to the client
// res - the Express response object
// statusCode - HTTP status code (200 for OK, 201 for Created, etc.)
// options - object that can contain: data, message, pagination
// The body will always have success: true
function sendSuccess(res, statusCode, options = {}) {
  const { data, message, pagination } = options;
  const body = { success: true };
  if (data !== undefined) body.data = data;
  if (message !== undefined && message !== "") body.message = message;
  if (pagination !== undefined) body.pagination = pagination;
  return res.status(statusCode).json(body);
}

// sendError - sends an error response to the client
// res - the Express response object
// statusCode - HTTP status code (400, 401, 403, 404, 500, etc.)
// error - either a string message or an Error object
// options - optional extra data to include in the response
// The body will always have success: false
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
