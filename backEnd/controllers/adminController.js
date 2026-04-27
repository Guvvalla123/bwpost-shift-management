// adminController.js
// This file handles admin operations.
// Only admin users can access these routes.
//
// ROUTES:
// GET  /api/admin/users
// POST /api/admin/users
// PUT  /api/admin/users/:userId/role
// POST /api/admin/users/:userId/reset-password-link
// GET  /api/admin/audit-logs

const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/sendResponse");
const { log } = require("../helpers/auditLogger");
const { getPaginationParams, getPaginationMeta } = require("../helpers/pagination");
// Import the shared reset link utility from authController
const { createResetLink } = require("./authController");

// Roles that are valid for user accounts
const VALID_ROLES = ["admin", "manager", "employee"];

// getAllUsers - gets all users in the system
// Admin can search and filter by role, including inactive accounts
exports.getAllUsers = asyncHandler(async (req, res) => {
  // Get pagination params from the query string
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);
  const { search = "", role, includeInactive } = req.query;

  const mongoQuery = {};

  // Filter by role if provided
  if (role) mongoQuery.role = role;

  // Search by username or email if provided
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    mongoQuery.$or = [
      { username: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }

  // Include inactive users only if explicitly requested
  if (includeInactive === "true") mongoQuery._includeInactive = true;
  else mongoQuery.isActive = { $ne: false };

  // Run both queries in parallel
  const [users, total] = await Promise.all([
    User.find(mongoQuery)
      .select("username email role managerId createdAt isActive deactivatedAt")
      .populate("managerId", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(mongoQuery),
  ]);

  return sendSuccess(res, 200, {
    data: users,
    pagination: getPaginationMeta(total, page, limit),
  });
});

// createUser - admin creates a new user account directly (no invite needed)
// Can create admins, managers, and employees
exports.createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role, managerId } = req.body;

  // Validate role is one of the allowed values
  if (!VALID_ROLES.includes(role)) throw new AppError("Invalid role", 400);

  // Check no account already exists with this email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new AppError("User with this email already exists", 400);

  // Build the user data object
  const userData = { username, email: email.toLowerCase(), password, role };

  // Employees must be assigned to a manager
  if (role === "employee") {
    if (!managerId) {
      throw new AppError(
        "Employees must be assigned to a manager. Please select a manager.",
        400
      );
    }
    const manager = await User.findOne({ _id: managerId, role: "manager" });
    if (!manager) throw new AppError("Invalid manager", 400);
    userData.managerId = managerId;
  }

  // Create the new user account
  const user = await User.create(userData);

  // Log the user creation
  log("user.create", req, "User", user._id, { role: user.role, email: user.email });
  if (userData.managerId) {
    log("user.assign_manager", req, "User", user._id, { managerId: userData.managerId });
  }

  // Capitalise the role name for the success message
  const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);

  return sendSuccess(res, 201, {
    message: `${roleLabel} created successfully`,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
});

// updateUserRole - changes a user's role
// For example, promoting an employee to manager
exports.updateUserRole = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  const { role, managerId } = req.body;

  // Validate the new role
  if (!VALID_ROLES.includes(role)) throw new AppError("Invalid role", 400);

  // Find the user (include inactive accounts)
  const user = await User.findOne({ _id: userId, _includeInactive: true });
  if (!user) throw new AppError("User not found", 404);

  const previousRole = user.role;

  // Nothing to do if the role is already the same
  if (previousRole === role) throw new AppError("User already has this role", 400);

  // Update the role
  user.role = role;

  // Employees must be assigned to a valid active manager
  if (role === "employee") {
    if (!managerId) throw new AppError("Employees must be assigned to a manager", 400);
    const manager = await User.findOne({ _id: managerId, role: "manager", isActive: { $ne: false } });
    if (!manager) throw new AppError("Invalid or inactive manager", 400);
    user.managerId = managerId;
  } else {
    // Non-employees do not have a manager
    user.managerId = null;
  }

  await user.save();

  // Log the role change
  log("user.role_change", req, "User", user._id, {
    previousRole,
    newRole: role,
    email: user.email,
    managerId: role === "employee" ? managerId : undefined,
  });

  return sendSuccess(res, 200, {
    message: "Role updated successfully",
    data: { _id: user._id, username: user.username, email: user.email, role: user.role },
  });
});

// generateResetLink - admin generates a password reset link for any user
// Cannot generate reset links for other admin accounts
exports.generateResetLink = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Find the user (include inactive accounts)
  const user = await User.findOne({ _id: userId, _includeInactive: true });
  if (!user) throw new AppError("User not found", 404);

  // Admins cannot generate reset links for other admins
  if (user.role === "admin") {
    throw new AppError("Password reset links cannot be generated for administrator accounts", 403);
  }

  // Generate the reset token and get the shareable link
  const { resetLink, expiresAt } = await createResetLink(
    req,
    user,
    "admin.password_reset_link"
  );

  return sendSuccess(res, 200, {
    message: "Password reset link generated",
    data: {
      resetLink,
      expiresAt: expiresAt.toISOString(),
      userEmail: user.email,
    },
  });
});

// getAuditLogs - returns the audit log records
// Shows who did what action and when
exports.getAuditLogs = asyncHandler(async (req, res) => {
  // Get pagination params from the query string
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);
  const { search = "", action, from, to } = req.query;

  const filter = {};

  // Filter by specific action if provided
  if (action) {
    filter.action = String(action);
  } else if (search) {
    // Search by action or IP address
    const esc = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { action: { $regex: esc, $options: "i" } },
      { ip: { $regex: esc, $options: "i" } },
    ];
  }

  // Filter by date range if provided
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(String(from));
    if (to) {
      const end = new Date(String(to));
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Run both queries in parallel
  const [data, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actorId", "username email role")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    data,
    pagination: getPaginationMeta(total, page, limit),
  });
});
