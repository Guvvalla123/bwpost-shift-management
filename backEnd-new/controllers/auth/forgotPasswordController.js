// forgotPasswordController.js
// This controller generates a password
// reset link for a user.
//
// Route: POST /api/users/forgot-password
//
// IMPORTANT - NO EMAIL SENDING:
// We do not send emails because we do not
// have a custom domain email yet.
// The reset link is returned in response.
// Admin copies the link and sends it
// to the user via WhatsApp.
//
// What this does:
// 1. Finds user by email
// 2. Creates a random reset token
// 3. Hashes and saves token to database
// 4. Sets expiry of 1 hour
// 5. Returns the full reset link

// User model to find and update user
const User = require("../../models/User");

// sendSuccess and sendError for responses
const { sendSuccess } = require("../../helpers/sendResponse");

// saveAuditLog to record this action
const saveAuditLog = require("../../helpers/saveAuditLog");

// crypto to generate random token
const crypto = require("crypto");

// forgotPassword - generates a password reset link
// Called when user submits forgot password form
//
// IMPORTANT: We do not send emails
// because we do not have a custom domain yet.
// Instead we return the reset link in the response.
// The admin or manager copies the link
// and sends it to the user via WhatsApp.
//
// What it does:
// 1. Finds the user by email
// 2. Creates a random reset token
// 3. Saves hashed version to database
// 4. Sets expiry time (1 hour)
// 5. Returns the reset link
async function forgotPasswordController(req, res, next) {
  try {
    // Get email from request body
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });

    // If no user with this email
    // We still return success for security
    // So attackers cannot find valid emails
    if (!user) {
      return sendSuccess(
        res,
        200,
        "If this email exists a reset link was generated"
      );
    }

    // Create a random reset token
    // This is what goes in the URL
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash the token before saving to database
    // We never store the raw token
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Save hashed token and expiry to user
    user.passwordResetToken = hashedToken;

    // Token expires in 1 hour
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000;

    await user.save();

    // Create the reset link with the raw token
    // User clicks this link to reset password
    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";
    const resetLink =
      frontendUrl + "/reset-password?token=" + resetToken;

    // Save audit log
    await saveAuditLog(
      "auth.password_reset_requested",
      user._id,
      user.role,
      { email: email },
      req.ip
    );

    // Return the reset link
    // In production this would be sent by email
    return sendSuccess(res, 200, "Reset link generated successfully", {
      resetLink: resetLink,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = forgotPasswordController;
