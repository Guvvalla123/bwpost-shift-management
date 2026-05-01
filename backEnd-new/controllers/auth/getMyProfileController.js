// getMyProfileController.js
// This controller returns the logged in
// user's profile data.
//
// Route: GET /api/users/me
//
// The user ID comes from req.user.id
// which was set by isLoggedIn middleware.
//
// What this does:
// 1. Gets user ID from req.user.id
// 2. Finds user in database
// 3. Returns user data without password

// User model to find the user
const User = require("../../models/User");

// sendSuccess and sendError for responses
const { sendSuccess, sendError } = require("../../helpers/sendResponse");

// getMyProfile - returns the logged in user data
// Called when frontend needs to know
// who is currently logged in
//
// The user ID comes from req.user
// which was set by isLoggedIn middleware
//
// Returns: user object without password
async function getMyProfileController(req, res, next) {
  try {
    // Get user from database using ID from token
    // req.user.id was set by isLoggedIn middleware
    const user = await User.findById(req.user.id);

    // If user not found
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Send user data back
    return sendSuccess(res, 200, "Profile loaded", {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        managerId: user.managerId,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = getMyProfileController;
