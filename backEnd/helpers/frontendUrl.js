// frontendUrl.js
// Returns the frontend application URL.
//
// Used when creating invite links and
// password reset links so they point
// to the correct frontend URL.
//
// In development: http://localhost:5173
// In production: https://bwpost-shift-management.vercel.app
//
// The URL comes from the FRONTEND_URL
// environment variable in the .env file.

const AppError = require("./AppError");

// getFrontendBaseUrl - reads FRONTEND_URL from environment and returns it
// Throws an AppError if FRONTEND_URL is not set in the environment.
// Removes any trailing slash so links are built correctly.
// Example: "https://app.example.com" (no trailing slash)
function getFrontendBaseUrl() {
  const raw = (process.env.FRONTEND_URL || "").trim();
  if (!raw) {
    throw new AppError("FRONTEND_URL is not configured. Set it in the environment.", 500);
  }
  return raw.replace(/\/$/, "");
}

module.exports = { getFrontendBaseUrl };
