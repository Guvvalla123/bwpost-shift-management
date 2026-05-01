// validateResetTokenController.js
// This controller checks if a password
// reset token is still valid.
//
// Route: GET /api/users/reset-password/validate/:token
//
// The frontend calls this when user
// opens the reset password link.
// If valid: show the reset form
// If invalid: show expired error message

// User model to find user with this token
const User = require("../../models/User");

// sendSuccess and sendError for responses
const { sendSuccess, sendError } = require("../../helpers/sendResponse");

// crypto to hash and compare the token
const crypto = require("crypto");

// validateResetToken - checks if reset token is valid
// Called when user opens the reset password link
// The frontend uses this to show the form
// or show an error if link is expired
//
// Token comes from URL: /reset-password?token=XXX
async function validateResetTokenController(req, res, next) {
  try {
    // Get token from URL params
    const { token } = req.params;

    // Hash the token to compare with database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with this token that has not expired
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      // Check token has not expired yet
      passwordResetExpires: { $gt: Date.now() },
    });

    // If no user found token is invalid or expired
    if (!user) {
      return sendError(
        res,
        400,
        "Reset link is invalid or has expired"
      );
    }

    // Token is valid
    return sendSuccess(res, 200, "Token is valid", { valid: true });
  } catch (error) {
    next(error);
  }
}

module.exports = validateResetTokenController;
