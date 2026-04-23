const User = require("../models/userModel");
const AuditLog = require("../models/auditLogModel");
const AppError = require("../utils/AppError");
const { log } = require("../utils/auditLog");
const { getPaginationParams, getPaginationMeta } = require("../utils/paginate");
const userService = require("./userService");

const VALID_ROLES = ["admin", "manager", "employee"];

const createUser = async (req, { username, email, password, role, managerId }) => {
  if (!VALID_ROLES.includes(role)) throw new AppError("Invalid role", 400);
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new AppError("User with this email already exists", 400);

  const userData = { username, email: email.toLowerCase(), password, role };
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

  const user = await User.create(userData);
  log("user.create", req, "User", user._id, { role: user.role, email: user.email });
  if (userData.managerId) {
    log("user.assign_manager", req, "User", user._id, { managerId: userData.managerId });
  }

  return {
    message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
    data: {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  };
};

const updateUserRole = async (req, userId, { role, managerId }) => {
  if (!VALID_ROLES.includes(role)) throw new AppError("Invalid role", 400);
  const user = await User.findOne({ _id: userId, _includeInactive: true });
  if (!user) throw new AppError("User not found", 404);
  const previousRole = user.role;
  if (previousRole === role) throw new AppError("User already has this role", 400);

  user.role = role;
  if (role === "employee") {
    if (!managerId) throw new AppError("Employees must be assigned to a manager", 400);
    const manager = await User.findOne({ _id: managerId, role: "manager", isActive: { $ne: false } });
    if (!manager) throw new AppError("Invalid or inactive manager", 400);
    user.managerId = managerId;
  } else {
    user.managerId = null;
  }
  await user.save();

  log("user.role_change", req, "User", user._id, {
    previousRole,
    newRole: role,
    email: user.email,
    managerId: role === "employee" ? managerId : undefined,
  });

  return {
    message: "Role updated successfully",
    data: { _id: user._id, username: user.username, email: user.email, role: user.role },
  };
};

const getAllUsers = async (query) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const { search = "", role, includeInactive } = query;
  const mongoQuery = {};
  if (role) mongoQuery.role = role;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    mongoQuery.$or = [
      { username: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }
  if (includeInactive === "true") mongoQuery._includeInactive = true;
  else mongoQuery.isActive = { $ne: false };

  const [users, total] = await Promise.all([
    User.find(mongoQuery)
      .select("username email role managerId createdAt isActive deactivatedAt")
      .populate("managerId", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(mongoQuery),
  ]);

  return {
    data: users,
    pagination: getPaginationMeta(total, page, limit),
  };
};

const generateUserPasswordResetLink = async (req, userId) => {
  const user = await User.findOne({ _id: userId, _includeInactive: true });
  if (!user) throw new AppError("User not found", 404);
  if (user.role === "admin") {
    throw new AppError("Password reset links cannot be generated for administrator accounts", 403);
  }
  const { resetLink, expiresAt } = await userService.savePasswordResetTokenAndGetLink(
    req,
    user,
    "admin.password_reset_link"
  );
  return {
    message: "Password reset link generated",
    data: {
      resetLink,
      expiresAt: expiresAt.toISOString(),
      userEmail: user.email,
    },
  };
};

const getAuditLogs = async (query) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const { search = "", action, from, to } = query;
  const filter = {};
  if (action) {
    filter.action = String(action);
  } else if (search) {
    const esc = String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [
      { action: { $regex: esc, $options: "i" } },
      { ip: { $regex: esc, $options: "i" } },
    ];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(String(from));
    if (to) {
      const end = new Date(String(to));
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  const [data, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("actorId", "username email role")
      .lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    data,
    pagination: getPaginationMeta(total, page, limit),
  };
};

module.exports = { createUser, updateUserRole, getAllUsers, generateUserPasswordResetLink, getAuditLogs };
