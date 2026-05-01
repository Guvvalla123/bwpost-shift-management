// validateInviteController.js
// Route: GET /api/invites/validate/:token
// Who: public
// Frontend calls before showing the registration form.
//
// Validates token exists, unused, unexpired.
// Returns preview fields when ok.

const Invite = require("../../models/Invite");

const {
  sendSuccess,
  sendError,
} = require("../../helpers/sendResponse");

// validateInviteController - sanity check invite link
async function validateInviteController(
  req,
  res,
  next
) {
  try {
    // Token travels in route params
    const { token } = req.params;

    const now = new Date();

    // Look up usable invite only
    const invite =
      await Invite.findOne({
        token,

        usedAt: null,

        expiresAt: { $gt: now },
      });

    // Missing stale or reused token
    if (!invite) {
      return sendError(
        res,
        400,
        "Invite is invalid expired or already used"
      );
    }

    return sendSuccess(res, 200, "Invite is valid", {
      email: invite.email,

      role: invite.role,

      valid: true,
    });
  } catch (error) {
    next(error);
  }
}

module.exports =
  validateInviteController;
