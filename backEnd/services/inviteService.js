const Invite = require("../models/inviteModel");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const { log } = require("../utils/auditLog");
const { getPaginationParams, getPaginationMeta } = require("../utils/paginate");

const VALID_ROLES = ["admin", "manager", "employee"];

const isValidTokenFormat = (t) => typeof t === "string" && /^[a-f0-9]{64}$/i.test(t);

const createInvite = async (req, actor, { email, role, managerId }) => {
  if (!VALID_ROLES.includes(role)) throw new AppError("Invalid role", 400);
  if (actor.role === "manager" && role !== "employee") {
    throw new AppError("Managers can only invite employees", 403);
  }
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new AppError("User with this email already exists", 400);
  const existingInvite = await Invite.findOne({ email: email.toLowerCase(), usedAt: null });
  if (existingInvite && existingInvite.expiresAt > new Date()) {
    throw new AppError("An active invite already exists for this email", 400);
  }

  let resolvedManagerId = null;
  if (role === "employee") {
    if (actor.role === "manager") {
      resolvedManagerId = actor.id;
    } else if (actor.role === "admin") {
      if (!managerId) throw new AppError("Employees must be assigned to a manager", 400);
      const manager = await User.findOne({ _id: managerId, role: "manager" });
      if (!manager) throw new AppError("Invalid manager", 400);
      resolvedManagerId = managerId;
    }
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  const invite = await Invite.create({
    email: email.toLowerCase(),
    role,
    managerId: resolvedManagerId,
    token: Invite.generateToken(),
    createdBy: actor.id,
    expiresAt,
  });
  log("invite.create", req, "Invite", invite._id, { email: invite.email, role: invite.role });
  return {
    message: "Invite created",
    data: {
      _id: invite._id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      inviteLink: `${process.env.FRONTEND_URL || "http://localhost:5173"}/register?invite=${invite.token}`,
    },
  };
};

const validateInviteToken = async (token) => {
  if (!isValidTokenFormat(token)) throw new AppError("Invalid invite token format", 400);
  const invite = await Invite.findOne({ token, usedAt: null });
  if (!invite) throw new AppError("Invalid or expired invite", 404);
  if (invite.expiresAt < new Date()) throw new AppError("Invite has expired", 400);
  return { email: invite.email, role: invite.role };
};

const acceptInvite = async (req, { token, username, password }) => {
  if (!token || !username || !password) {
    throw new AppError("Token, username, and password are required", 400);
  }
  if (!isValidTokenFormat(token)) throw new AppError("Invalid invite token format", 400);
  const invite = await Invite.findOne({ token, usedAt: null });
  if (!invite) throw new AppError("Invalid or expired invite", 404);
  if (invite.expiresAt < new Date()) throw new AppError("Invite has expired", 400);
  const existingUser = await User.findOne({ email: invite.email });
  if (existingUser) throw new AppError("User with this email already exists", 400);

  const now = new Date();
  const markedUsed = await Invite.findOneAndUpdate(
    { _id: invite._id, usedAt: null },
    { $set: { usedAt: now } },
    { new: true }
  );
  if (!markedUsed) throw new AppError("Invite was already used", 409);

  const userData = {
    username,
    email: invite.email,
    password,
    role: invite.role,
  };
  if (invite.managerId) userData.managerId = invite.managerId;
  const user = await User.create(userData);
  log("invite.accept", req, "User", user._id, { inviteId: invite._id }, {
    actorId: user._id,
    actorRole: user.role,
  });
  return { message: "Account created successfully" };
};

const getAllInvites = async (actor, query) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const { used } = query;
  const mongoQuery = {};
  if (actor.role === "manager") {
    mongoQuery.$or = [{ createdBy: actor.id }, { managerId: actor.id }];
  }
  if (used === "true") mongoQuery.usedAt = { $ne: null };
  else if (used === "false") mongoQuery.usedAt = null;

  const [invites, total] = await Promise.all([
    Invite.find(mongoQuery)
      .populate("createdBy", "username email")
      .populate("managerId", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Invite.countDocuments(mongoQuery),
  ]);
  return {
    data: invites,
    pagination: getPaginationMeta(total, page, limit),
  };
};

module.exports = {
  createInvite,
  validateInviteToken,
  acceptInvite,
  getAllInvites,
};
