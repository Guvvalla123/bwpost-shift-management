// resetPasswordController.js
// This controller sets a new password
// using the password reset token.
//
// Route: POST /api/users/reset-password
//
// What this does:
// 1. Gets token and new password from body
// 2. Hashes token to find user in database
// 3. Checks token has not expired
// 4. Saves the new password
//    (pre-save hook hashes it automatically)
// 5. Clears the reset token
//    so the link cannot be used again
// 6. Logs out all devices for security
// 7. Returns success message

// User model to find and update user
const User = require("../../models/User");

// sendSuccess and sendError for responses
const { sendSuccess, sendError } = require("../../helpers/sendResponse");

// saveAuditLog to record password reset
const saveAuditLog = require("../../helpers/saveAuditLog");

// crypto to hash and compare the token
const crypto = require("crypto");

// resetPassword - sets a new password
// Called when user submits the reset form
//
// What it does:
// 1. Gets token and new password from body
// 2. Verifies token is valid and not expired
// 3. Updates the password in database
// 4. Clears the reset token
// 5. Returns success message
async function resetPasswordController(req, res, next) {
  try {
    // Get token and new password from request body
    const { token, password } = req.body;

    // Hash the token to compare with database
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find user with valid token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    // If no user found
    if (!user) {
      return sendError(
        res,
        400,
        "Reset link is invalid or has expired"
      );
    }

    // Set the new password
    // The pre-save hook will hash it automatically
    user.password = password;

    // Clear the reset token so link cannot be reused
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    // Also clear refresh token to log out all devices
    // This forces re-login after password change
    user.refreshToken = undefined;

    await user.save();

    // Save audit log
    await saveAuditLog(
      "auth.password_reset_completed",
      user._id,
      user.role,
      { email: user.email },
      req.ip
    );

    return sendSuccess(
      res,
      200,
      "Password reset successful. Please login."
    );
  } catch (error) {
    next(error);
  }
}

module.exports = resetPasswordController;
