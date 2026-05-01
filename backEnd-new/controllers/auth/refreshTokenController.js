// refreshTokenController.js
// This controller creates a new access token
// when the old one expires.
//
// Route: POST /api/users/refresh-token
//
// The frontend calls this automatically
// without the user knowing.
// This keeps the user logged in without
// needing to enter password again.
//
// What this does:
// 1. Reads refresh token from cookie
// 2. Verifies the token is valid
// 3. Checks it matches what is in database
// 4. Creates new access and refresh tokens
// 5. Saves new refresh token to database
// 6. Returns success

// User model to find and update user
const User = require("../../models/User");

// sendTokens to create new JWT cookies
// clearTokens to clear cookies if invalid
const { sendTokens, clearTokens } = require("../../helpers/createToken");

// sendSuccess and sendError for responses
const { sendSuccess, sendError } = require("../../helpers/sendResponse");

// jwt to verify the refresh token
const jwt = require("jsonwebtoken");

// refreshToken - creates new access token
// Called automatically by the frontend
// when the access token expires
//
// What it does:
// 1. Reads refresh token from cookie
// 2. Verifies it is valid
// 3. Checks it matches what is in database
// 4. Creates new access and refresh tokens
// 5. Returns success
//
// The frontend calls this automatically
// so the user does not need to login again
async function refreshTokenController(req, res, next) {
  try {
    // Read refresh token from cookie
    const token = req.cookies.refreshToken;

    // If no refresh token user needs to login
    if (!token) {
      return sendError(res, 401, "Please login again");
    }

    // Verify the refresh token
    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

    // Find user and check stored refresh token
    const user = await User.findById(decoded.id).select("+refreshToken");

    // If user not found or token does not match
    if (!user || user.refreshToken !== token) {
      return sendError(res, 401, "Please login again");
    }

    // Create new tokens and set new cookies
    const newRefreshTokenStr = sendTokens(user._id, user.role, res);

    // Save new refresh token to database
    user.refreshToken = newRefreshTokenStr;
    await user.save();

    return sendSuccess(res, 200, "Token refreshed");
  } catch (error) {
    // If token is invalid or expired
    clearTokens(res);
    return sendError(res, 401, "Please login again");
  }
}

module.exports = refreshTokenController;
