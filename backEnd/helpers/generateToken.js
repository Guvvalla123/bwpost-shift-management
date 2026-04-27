// generateToken.js
// This file creates JWT tokens and
// stores them in browser cookies.
//
// WHY WE USE COOKIES:
// We store tokens in HTTP-only cookies
// instead of localStorage because:
//
// 1. HTTP-only cookies cannot be read
//    by JavaScript in the browser
//    This protects against XSS attacks
//
// 2. The browser automatically sends
//    the cookie with every API request
//    We do not need to attach it manually
//
// 3. More secure than localStorage
//    because JavaScript cannot steal it
//
// HOW TOKENS WORK:
// Access Token:
//   - Short lived (15 minutes)
//   - Stored in cookie named "token"
//   - Contains user ID and role
//   - Used to verify user on each request
//
// Refresh Token:
//   - Longer lived (8 hours)
//   - Stored in cookie named "refreshToken"
//   - Used to create new access token
//     when access token expires
//   - User stays logged in without
//     entering password again
//
// When user logs out:
//   Both cookies are cleared
//   User must login again

const jwt = require("jsonwebtoken");

// generateAccessToken - creates a short-lived JWT string (not a cookie yet)
// user - the user object with _id and role fields
// Returns a signed JWT string that expires in JWT_EXPIRES_IN (15 minutes)
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

// generateRefreshToken - creates a longer-lived JWT string (not a cookie yet)
// user - the user object with _id field
// Returns a signed JWT string that expires in REFRESH_TOKEN_EXPIRES_IN (8 hours)
const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "8h" }
  );

// getRefreshCookieMaxAgeMs - returns how long the refresh cookie lives in milliseconds
// This is 8 hours = 8 * 60 * 60 * 1000
const getRefreshCookieMaxAgeMs = () => 8 * 60 * 60 * 1000;

// getCookieOptions - returns the options object used when setting a cookie
// maxAge - how long the cookie should live in milliseconds
// In production: secure=true, sameSite="none" (for cross-origin requests)
// In development: secure=false, sameSite="lax" (for localhost)
const getCookieOptions = (maxAge) => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge,
    path: "/",
  };
};

// getClearCookieOptions - returns the options object used when clearing a cookie
// Same settings as getCookieOptions but without maxAge
// Used when logging out to tell the browser to delete the cookie
const getClearCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
};

// createAccessToken - creates a 15 minute access token and stores it in a cookie
// userId - the logged in user ID
// userRole - admin, manager, or employee
// res - the Express response object to attach the cookie to
const createAccessToken = (userId, userRole, res) => {
  const token = jwt.sign(
    { id: userId, role: userRole },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
  res.cookie("token", token, getCookieOptions(15 * 60 * 1000));
  return token;
};

// createRefreshToken - creates an 8 hour refresh token and stores it in a cookie
// userId - the logged in user ID
// res - the Express response object to attach the cookie to
const createRefreshToken = (userId, res) => {
  const token = jwt.sign(
    { id: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "8h" }
  );
  res.cookie("refreshToken", token, getCookieOptions(getRefreshCookieMaxAgeMs()));
  return token;
};

// clearTokenCookies - removes both token cookies from the browser
// Called when user clicks logout
// After this the user cannot make authenticated requests
// res - the Express response object
const clearTokenCookies = (res) => {
  const opts = getClearCookieOptions();
  res.clearCookie("token", opts);
  res.clearCookie("refreshToken", opts);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  getRefreshCookieMaxAgeMs,
  getCookieOptions,
  getClearCookieOptions,
  createAccessToken,
  createRefreshToken,
  clearTokenCookies,
};
