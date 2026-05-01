// updateMyProfileController.js
// This controller updates the logged in
// user's profile information.
//
// Route: PUT /api/users/profile
//
// What can be updated:
// - username (their display name)
// - profileImage (URL of their photo)
//
// Email and password cannot be
// changed through this controller.

// User model to update the user
const User = require("../../models/User");

// sendSuccess for responses when update succeeds
const { sendSuccess } = require("../../helpers/sendResponse");

// saveAuditLog to record profile update
const saveAuditLog = require("../../helpers/saveAuditLog");

// updateMyProfile - updates user profile info
// Called when user saves profile changes
//
// What can be updated:
// - username (display name)
// - profileImage (URL of photo)
//
// Email and password cannot be changed here
async function updateMyProfileController(req, res, next) {
  try {
    // Get the fields to update from request body
    const { username, profileImage } = req.body;

    // Build an object with only the fields provided
    const updatedFields = {};

    // Only update username if it was provided
    if (username !== undefined && username !== null) {
      updatedFields.username = username;
    }

    // Only update image if it was provided
    if (profileImage !== undefined && profileImage !== null) {
      updatedFields.profileImage = profileImage;
    }

    // Update the user in database
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      updatedFields,
      // new: true returns the updated document
      { new: true }
    );

    // Save audit log
    await saveAuditLog(
      "user.profile.update",
      req.user.id,
      req.user.role,
      { updatedFields: updatedFields },
      req.ip
    );

    return sendSuccess(res, 200, "Profile updated", {
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role,
        profileImage: updatedUser.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = updateMyProfileController;
