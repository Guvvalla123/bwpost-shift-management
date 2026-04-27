// authRoutes.js
// These routes handle authentication.
// Login, logout, register and password reset.
//
// BASE URL: /api/users
// All routes here start with /api/users
//
// PUBLIC ROUTES (no login needed):
// POST /api/users/login
// POST /api/users/logout
// POST /api/users/refresh-token
// POST /api/users/forgot-password
// GET  /api/users/reset-password/validate/:token
// POST /api/users/reset-password
// GET  /api/users/registration-status
//
// PROTECTED ROUTES (must be logged in):
// GET    /api/users/me
// PUT    /api/users/profile
// GET    /api/users/sessions
// DELETE /api/users/sessions
// DELETE /api/users/sessions/:sessionId

const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const AppError = require("../helpers/AppError");
const { logEvent } = require("../helpers/securityLog");
const { isLoggedIn } = require("../middleware/authMiddleware");
const validateInput = require("../middleware/validateInput");
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} = require("../validation/authValidation");

// Import directly from authController (no shim needed)
const {
  registerUser,
  login,
  logout,
  refreshToken,
  getMyProfile,
  updateMyProfile,
  getRegistrationStatus,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getActiveSessions,
  logoutAllDevices,
  logoutOneSession,
} = require("../controllers/authController");

// Rate limiter for login and password-related routes
// Blocks brute force attacks by limiting to 10 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logEvent("rate_limit_auth", req, { window: "15m" });
    next(new AppError("Too many attempts, please try again after 15 minutes", options.statusCode));
  },
});

// Rate limiter for token refresh
// More permissive than auth limiter (30 per 15 minutes)
const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logEvent("rate_limit_refresh", req, { window: "15m" });
    next(new AppError("Too many refresh attempts, please try again later", options.statusCode));
  },
});

// GET /api/users/registration-status
// Frontend checks this to decide whether to show the Register link
// Always returns false because public registration is disabled in this app
router.get("/registration-status", getRegistrationStatus);

// POST /api/users/register
// Public registration is disabled — users must use an invite link
// This route exists to return a clear error message if someone tries
router.post("/register", authLimiter, validateInput(registerSchema), registerUser);

// POST /api/users/login
// User submits email and password
// No authentication required
// Returns user data and sets access + refresh token cookies
router.post("/login", authLimiter, validateInput(loginSchema), login);

// POST /api/users/forgot-password
// User submits their email to get a password reset link
// Returns the reset link directly (no email is sent in this app)
router.post("/forgot-password", authLimiter, validateInput(forgotPasswordSchema), forgotPassword);

// GET /api/users/reset-password/validate/:token
// Frontend calls this when user opens the reset password link
// Checks the token is valid and not expired before showing the form
router.get("/reset-password/validate/:token", authLimiter, validateResetToken);

// POST /api/users/reset-password
// User submits the new password along with the reset token
// Clears all sessions so old tokens cannot be reused
router.post("/reset-password", authLimiter, validateInput(resetPasswordSchema), resetPassword);

// POST /api/users/logout
// User clicks the logout button
// Clears both token cookies from the browser
// User must login again after this
router.post("/logout", logout);

// POST /api/users/refresh-token
// Called automatically by the frontend when the access token expires
// Uses the refresh token cookie to create a new access token cookie
// Frontend does this silently in the background
router.post("/refresh-token", refreshLimiter, refreshToken);

// GET /api/users/me
// Returns the logged in user's profile data
// Frontend calls this on page load to get current user info
router.get("/me", isLoggedIn, getMyProfile);

// GET /api/users/sessions
// Returns all active login sessions for this user
// Shows device info and IP for each session
router.get("/sessions", isLoggedIn, getActiveSessions);

// DELETE /api/users/sessions
// Logs out from ALL devices at once
// Clears every refresh token session stored for this user
router.delete("/sessions", isLoggedIn, logoutAllDevices);

// DELETE /api/users/sessions/:sessionId
// Logs out one specific session by its ID
// Used when user clicks "Remove" next to a session in the sessions list
router.delete("/sessions/:sessionId", isLoggedIn, logoutOneSession);

// PUT /api/users/profile
// Updates the logged in user's username or profile image URL
// At least one of username or profileImage must be provided
router.put("/profile", isLoggedIn, validateInput(updateProfileSchema), updateMyProfile);

module.exports = router;
