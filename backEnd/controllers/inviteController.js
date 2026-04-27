// inviteController.js
// This file handles the invite system.
// Admin or manager creates invite links.
// New users register using the invite link.
//
// ROUTES:
// GET  /api/invites
// POST /api/invites
// GET  /api/invites/validate/:token
// POST /api/invites/accept
//
// HOW INVITES WORK:
// 1. Admin creates invite for new employee
// 2. System generates a unique random token
// 3. Token is stored hashed in database
// 4. A registration link is created with token
// 5. Admin copies link and sends via WhatsApp
// 6. New employee opens link and registers
// 7. Token is validated and marked as used
// 8. New employee account is created

const Invite = require("../models/Invite");
const User = require("../models/User");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/sendResponse");
const { log } = require("../helpers/auditLogger");
const { getPaginationParams, getPaginationMeta } = require("../helpers/pagination");
const { getFrontendBaseUrl } = require("../helpers/frontendUrl");

// Valid roles that can be assigned to invited users
const VALID_ROLES = ["admin", "manager", "employee"];

// Check that a token is a 64-character hex string (our invite token format)
const isValidTokenFormat = (t) => typeof t === "string" && /^[a-f0-9]{64}$/i.test(t);

// createInvite - creates a new invite link for a new user
// The invite stores a hashed token and generates a registration URL
// Admin can invite any role, manager can only invite employees
exports.createInvite = asyncHandler(async (req, res) => {
  const actor = req.user;
  const { email, role, managerId } = req.body;

  // Validate that the role is allowed
  if (!VALID_ROLES.includes(role)) throw new AppError("Invalid role", 400);

  // Managers can only invite employees, not other managers or admins
  if (actor.role === "manager" && role !== "employee") {
    throw new AppError("Managers can only invite employees", 403);
  }

  // Check if a user with this email already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new AppError("User with this email already exists", 400);

  // Check if a pending invite for this email already exists
  const existingInvite = await Invite.findOne({ email: email.toLowerCase(), usedAt: null });
  if (existingInvite && existingInvite.expiresAt > new Date()) {
    throw new AppError("An active invite already exists for this email", 400);
  }

  // Determine which manager ID to assign for employee invites
  let resolvedManagerId = null;
  if (role === "employee") {
    if (actor.role === "manager") {
      // Manager is inviting someone to their own team
      resolvedManagerId = actor.id;
    } else if (actor.role === "admin") {
      // Admin must specify which manager the employee belongs to
      if (!managerId) throw new AppError("Employees must be assigned to a manager", 400);
      const manager = await User.findOne({ _id: managerId, role: "manager" });
      if (!manager) throw new AppError("Invalid manager", 400);
      resolvedManagerId = managerId;
    }
  }

  // Set invite expiry to 7 days from now
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Create the invite record in the database
  // Invite.generateToken() creates the raw token and stores the hash internally
  const invite = await Invite.create({
    email: email.toLowerCase(),
    role,
    managerId: resolvedManagerId,
    token: Invite.generateToken(),
    createdBy: actor.id,
    expiresAt,
  });

  // Log the invite creation
  log("invite.create", req, "Invite", invite._id, { email: invite.email, role: invite.role });

  // Build the registration URL that will be shared with the new user
  const inviteLink = `${getFrontendBaseUrl()}/register?invite=${invite.token}`;

  return sendSuccess(res, 201, {
    message: "Invite created",
    data: {
      _id: invite._id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteLink,
    },
  });
});

// validateInviteToken - checks if an invite token is still valid
// Called when the new user opens the invite link before showing the registration form
exports.validateInvite = asyncHandler(async (req, res) => {
  const token = req.params.token;

  // Validate the token format before querying the database
  if (!isValidTokenFormat(token)) throw new AppError("Invalid invite token format", 400);

  // Find an invite with this token that has not been used yet
  const invite = await Invite.findOne({ token, usedAt: null });
  if (!invite) throw new AppError("Invalid or expired invite", 404);

  // Check that the invite has not expired
  if (invite.expiresAt < new Date()) throw new AppError("Invite has expired", 400);

  return sendSuccess(res, 200, {
    data: { email: invite.email, role: invite.role },
  });
});

// acceptInvite - new user registers using their invite link
// Creates their user account and marks the invite as used
exports.acceptInvite = asyncHandler(async (req, res) => {
  const { token, username, password } = req.body;

  // Validate all required fields are present
  if (!token || !username || !password) {
    throw new AppError("Token, username, and password are required", 400);
  }

  // Validate the token format
  if (!isValidTokenFormat(token)) throw new AppError("Invalid invite token format", 400);

  // Find the invite (must not already be used)
  const invite = await Invite.findOne({ token, usedAt: null });
  if (!invite) throw new AppError("Invalid or expired invite", 404);

  // Check invite has not expired
  if (invite.expiresAt < new Date()) throw new AppError("Invite has expired", 400);

  // Check no one else registered with this email first
  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) throw new AppError("User with this email already exists", 400);

  const now = new Date();

  // Mark the invite as used atomically (prevents race conditions)
  const markedUsed = await Invite.findOneAndUpdate(
    { _id: invite._id, usedAt: null },
    { $set: { usedAt: now } },
    { new: true }
  );
  if (!markedUsed) throw new AppError("Invite was already used", 409);

  // Build the user data from the invite details
  const userData = {
    username,
    email: invite.email,
    password,
    role: invite.role,
  };

  // Attach manager if this is an employee invite
  if (invite.managerId) userData.managerId = invite.managerId;

  // Create the new user account
  const user = await User.create(userData);

  // Log the invite acceptance
  log("invite.accept", req, "User", user._id, { inviteId: invite._id }, {
    actorId: user._id,
    actorRole: user.role,
  });

  return sendSuccess(res, 201, { message: "Account created successfully" });
});

// getAllInvites - returns all invites visible to this user
// Managers only see invites they created or that belong to their team
exports.getAllInvites = asyncHandler(async (req, res) => {
  const actor = req.user;

  // Get pagination params from the query string
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);
  const { used } = req.query;

  const mongoQuery = {};

  // Managers can only see invites they created or for their employees
  if (actor.role === "manager") {
    mongoQuery.$or = [{ createdBy: actor.id }, { managerId: actor.id }];
  }

  // Filter by used/unused status if provided
  if (used === "true") mongoQuery.usedAt = { $ne: null };
  else if (used === "false") mongoQuery.usedAt = null;

  // Run both queries in parallel
  const [invites, total] = await Promise.all([
    Invite.find(mongoQuery)
      .populate("createdBy", "username email")
      .populate("managerId", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Invite.countDocuments(mongoQuery),
  ]);

  return sendSuccess(res, 200, {
    data: invites,
    pagination: getPaginationMeta(total, page, limit),
  });
});
