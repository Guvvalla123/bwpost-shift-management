// generateResetLinkController.js
// Route: POST /api/admin/users/:userId/reset-password-link
// Who: admin only
// Mirrors forgot-password hashing but scopes to any profile.

const crypto = require("crypto");

const User = require("../../models/User");

const {
  sendSuccess,
  sendError,
} = require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

// generateResetLinkController - issues one-hour token link
async function generateResetLinkController(
  req,
  res,
  next
) {
  try {
    const { userId } = req.params;

    const user =
      await User.findById(userId);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    // Raw token goes to user; database stores digest only
    const rawToken = crypto
      .randomBytes(32)
      .toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.passwordResetToken = hashedToken;

    user.passwordResetExpires =
      Date.now() + 60 * 60 * 1000;

    await user.save();

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetLink =
      frontendUrl +
      "/reset-password?token=" +
      rawToken;

    await saveAuditLog(
      "admin.reset_link_generated",
      req.user.id,

      req.user.role,

      {
        targetUserId: user._id,

        email:
          user.email,
      },

      req.ip
    );

    return sendSuccess(
      res,

      200,

      "Reset link generated",

      {
        resetLink,
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports =
  generateResetLinkController;
