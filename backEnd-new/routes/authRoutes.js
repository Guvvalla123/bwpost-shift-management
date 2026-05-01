// authRoutes.js
// These are the routes for authentication.
// They handle login logout and password reset.
//
// BASE URL: /api/users
// All routes here start with /api/users
// This is set in server.js
//
// PUBLIC ROUTES (no login needed):
// POST /api/users/login
// POST /api/users/logout
// POST /api/users/refresh-token
// POST /api/users/forgot-password
// GET  /api/users/reset-password/validate/:token
// POST /api/users/reset-password
//
// PROTECTED ROUTES (must be logged in):
// GET  /api/users/me
// PUT  /api/users/profile

const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

// Import each controller from its own file
// Each file is named after what it does

// Handles user login
const loginController = require("../controllers/auth/loginController");

// Handles user logout
const logoutController = require("../controllers/auth/logoutController");

// Creates new access token when old one expires
const refreshTokenController = require("../controllers/auth/refreshTokenController");

// Returns logged in user profile
const getMyProfileController = require("../controllers/auth/getMyProfileController");

// Updates user profile
const updateMyProfileController = require("../controllers/auth/updateMyProfileController");

// Generates password reset link
const forgotPasswordController = require("../controllers/auth/forgotPasswordController");

// Checks if reset token is valid
const validateResetTokenController = require("../controllers/auth/validateResetTokenController");

// Sets new password with reset token
const resetPasswordController = require("../controllers/auth/resetPasswordController");

// Import middleware
const isLoggedIn = require("../middleware/isLoggedIn");
const validate = require("../middleware/validate");

// POST /api/users/login
// User submits email and password to login
// Validates email format and password length
// No authentication required for this route
router.post(
  "/login",
  [
    // Check email is valid format
    check("email").isEmail().withMessage("Please enter a valid email address"),

    // Check password is provided
    check("password").notEmpty().withMessage("Password is required"),

    // Run the validate middleware
    validate,
  ],
  loginController
);

// POST /api/users/logout
// User clicks the logout button
// Clears tokens and cookies
// No authentication required
router.post("/logout", logoutController);

// POST /api/users/refresh-token
// Called automatically when access token expires
// Uses refresh token cookie to create new tokens
// Frontend calls this without user knowing
router.post("/refresh-token", refreshTokenController);

// GET /api/users/me
// Returns the currently logged in user data
// Requires valid token (isLoggedIn middleware)
router.get("/me", isLoggedIn, getMyProfileController);

// PUT /api/users/profile
// Updates user profile information
// Requires valid token
router.put(
  "/profile",
  [
    isLoggedIn,

    // Username must be at least 2 characters
    check("username")
      .optional()
      .isLength({ min: 2 })
      .withMessage("Username must be at least 2 characters"),

    validate,
  ],
  updateMyProfileController
);

// POST /api/users/forgot-password
// User enters email to get reset link
// No authentication required
router.post(
  "/forgot-password",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email address"),
    validate,
  ],
  forgotPasswordController
);

// GET /api/users/reset-password/validate/:token
// Checks if a reset token is valid before showing form
// No authentication required
router.get(
  "/reset-password/validate/:token",
  validateResetTokenController
);

// POST /api/users/reset-password
// User submits new password with reset token
// No authentication required
router.post(
  "/reset-password",
  [
    check("token")
      .notEmpty()
      .withMessage("Reset token is required"),

    check("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),

    validate,
  ],
  resetPasswordController
);

module.exports = router;
