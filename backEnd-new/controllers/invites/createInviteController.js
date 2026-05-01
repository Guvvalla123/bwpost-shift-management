// createInviteController.js
// Route: POST /api/invites
// Who: admin and manager
// Creates invite link so a new user can register.
//
// Steps:
// 1. Validate rules for email role managerId per caller role
// 2. Confirm email is not already used by an active account
// 3. Build 64-char hex token and 7-day expiry
// 4. Save invite and audit log
// 5. Return invite record plus full registration URL

const crypto = require("crypto");

const Invite = require("../../models/Invite");

const User = require("../../models/User");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

// createInviteController - admin or manager posts a new invite
async function createInviteController(
  req,
  res,
  next
) {
  try {
    // Read body fields from JSON
    const { email, role, managerId } = req.body;

    // Normalize email for consistent lookup
    const emailNorm = String(email || "")
      .trim()
      .toLowerCase();

    // Manager users may only invite employees
    if (req.user.role === "manager") {
      if (role !== "employee") {
        return sendError(
          res,
          403,
          "Managers can only invite employees"
        );
      }
    }

    // Employee invites must include which manager they report to
    if (role === "employee" && !managerId) {
      return sendError(
        res,
        400,
        "managerId is required for employee invites"
      );
    }

    // Non-employee roles should not carry a manager linkage
    if (role !== "employee" && managerId) {
      return sendError(
        res,
        400,
        "managerId is only allowed for employee role"
      );
    }

    // When a manager invites, force their own id as managerId
    let managerObjectId = managerId;

    if (req.user.role === "manager") {
      managerObjectId = req.user.id;
    }

    // If linking to a manager document, ensure it exists and is a manager
    if (role === "employee") {
      const mgr = await User.findById(
        managerObjectId
      ).select("role");

      if (!mgr || mgr.role !== "manager") {
        return sendError(
          res,
          400,
          "managerId must be a valid manager"
        );
      }
    }

    // Block duplicates for accounts that still log in today
    const activeUser = await User.findOne({
      email: emailNorm,

      isActive: true,
    });

    if (activeUser) {
      return sendError(
        res,
        400,
        "This email is already registered as an active user"
      );
    }

    // If any inactive user still holds this email, unique index blocks reuse
    const anyUser = await User.findOne({
      email: emailNorm,
    });

    if (anyUser) {
      return sendError(
        res,
        400,
        "This email is already in the system"
      );
    }

    // Build a 32-byte token then hex-encode to 64 characters
    const token = crypto
      .randomBytes(32)
      .toString("hex");

    // Expire one week from creation time
    const expiresAt = new Date();

    expiresAt.setDate(expiresAt.getDate() + 7);

    // Persist the invite row
    const invite = await Invite.create({
      email: emailNorm,

      role,

      managerId:
        role === "employee"
          ? managerObjectId
          : undefined,

      token,

      expiresAt,

      createdBy: req.user.id,
    });

    // Base URL comes from env with sensible default
    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const inviteLink =
      frontendUrl +
      "/register?invite=" +
      token;

    // Record who created the invite
    await saveAuditLog(
      "invite.created",
      req.user.id,
      req.user.role,
      {
        email: emailNorm,

        role,

        inviteId: invite._id,
      },

      req.ip
    );

    return sendSuccess(
      res,

      201,

      "Invite created successfully",

      {
        invite,

        inviteLink,
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports = createInviteController;
