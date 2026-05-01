// logoutController.js
// This controller handles user logout.
// Called when user clicks the logout button.
//
// Route: POST /api/users/logout
//
// What this does:
// 1. Gets refresh token from cookie
// 2. Removes it from the database
// 3. Clears both token cookies from browser
// 4. Returns success message
//
// After this user must login again
// to access any protected routes

// User model to clear the refresh token
const User = require("../../models/User");

// clearTokens to remove cookies from browser
const { clearTokens } = require("../../helpers/createToken");

// sendSuccess for the response
const { sendSuccess } = require("../../helpers/sendResponse");

// logout - handles user logout request
// Called when user clicks the logout button
//
// What it does:
// 1. Clears the refresh token from database
// 2. Clears both token cookies from browser
// 3. Returns success message
//
// After logout the user must login again
// to access protected routes
async function logoutController(req, res, next) {
  try {
    // Get refresh token from cookie
    const { refreshToken } = req.cookies;

    // If there is a refresh token
    // clear it from the database
    if (refreshToken) {
      // Find user with this refresh token
      // and clear it
      await User.findOneAndUpdate({ refreshToken: refreshToken }, { refreshToken: null });
    }

    // Clear both token cookies from the browser
    // After this the user cannot make requests
    clearTokens(res);

    // Send success response
    return sendSuccess(res, 200, "Logged out successfully");
  } catch (error) {
    next(error);
  }
}

module.exports = logoutController;
