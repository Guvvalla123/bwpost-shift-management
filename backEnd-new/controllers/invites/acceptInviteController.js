// acceptInviteController.js
// Route: POST /api/invites/accept
// Who: public
// Final step: registers user bound to invite payload.
//
// Does not issue cookies — user logs in afterward.

const Invite = require("../../models/Invite");

const User = require("../../models/User");

const {
  sendSuccess,
  sendError,
} = require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

// acceptInviteController - consumes token once safely
async function acceptInviteController(
  req,
  res,
  next
) {
  try {
    const { token, username, password } =
      req.body;

    const trimmedName = String(username || "")
      .trim();

    const now = new Date();

    // Lock onto a fresh invite matching token
    const invite =
      await Invite.findOne({
        token,

        usedAt: null,

        expiresAt: { $gt: now },
      });

    if (!invite) {
      return sendError(
        res,
        400,
        "Invite is invalid expired or already used"
      );
    }

    const nameTaken =
      await User.findOne({
        username: trimmedName,
      });

    if (nameTaken) {
      return sendError(
        res,
        400,
        "Username is already taken"
      );
    }

    const emailTaken = await User.findOne({
      email: invite.email,
    });

    if (emailTaken) {
      return sendError(
        res,
        400,
        "This email already has an account"
      );
    }

    // Compose new login record
    const userPayload = {
      username: trimmedName,

      email: invite.email,

      password,

      role: invite.role,

      isActive: true,
    };

    // Employees inherit manager from invite
    if (
      invite.role === "employee" &&
      invite.managerId
    ) {
      userPayload.managerId = invite.managerId;
    }

    const newUser = await User.create(
      userPayload
    );

    // Single-use semantics
    invite.usedAt = new Date();

    await invite.save();

    await saveAuditLog(
      "invite.accepted",
      newUser._id,
      newUser.role,
      {
        inviteId: invite._id,

        email: invite.email,
      },

      req.ip
    );

    return sendSuccess(
      res,

      201,

      "Account created successfully. Please go to the login page to sign in."
    );
  } catch (error) {
    next(error);
  }
}

module.exports = acceptInviteController;
