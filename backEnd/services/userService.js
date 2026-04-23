const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const { log } = require("../utils/auditLog");
const { getFrontendBaseUrl } = require("../utils/frontendUrl");

const isValidResetTokenFormat = (t) =>
  typeof t === "string" && /^[a-f0-9]{64}$/i.test(t);

const hashResetToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

const getPasswordResetTtlMs = () => {
  const raw = process.env.PASSWORD_RESET_EXPIRE_MS;
  const n = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n > 0) return n;
  return 60 * 60 * 1000;
};

/**
 * Store hashed token on user, return plain link for sharing (raw token only in link).
 * Used by self-service forgot password and admin/manager link generation.
 */
const savePasswordResetTokenAndGetLink = async (req, user, auditEventName) => {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + getPasswordResetTtlMs());
  user.passwordResetTokenHash = hashResetToken(rawToken);
  user.passwordResetExpires = expiresAt;
  await user.save();
  const resetLink = `${getFrontendBaseUrl()}/reset-password?token=${rawToken}`;
  if (auditEventName) {
    log(auditEventName, req, "User", user._id, { email: user.email }, {
      actorId: req.user ? req.user.id : user._id,
      actorRole: req.user ? req.user.role : user.role,
    });
  }
  return { resetLink, expiresAt };
};

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "8h" }
  );

/** Milliseconds for refresh-token HTTP cookie maxAge (align with REFRESH_TOKEN_EXPIRES_IN policy). */
const getRefreshCookieMaxAgeMs = () => 8 * 60 * 60 * 1000;

const getCookieOptions = (maxAge) => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge,
    path: "/",
  };
};

const getClearCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
};

const getRegistrationStatus = () => ({ publicRegistrationEnabled: false });

const hashRefreshToken = (raw) =>
  crypto.createHash("sha256").update(raw, "utf8").digest("hex");

const getClientIp = (req) => {
  const x = req.get("x-forwarded-for");
  if (x) return x.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "";
};

const getDeviceInfo = (req) => (req.get("user-agent") || "").slice(0, 512);

const getSessionExpiresAt = () => new Date(Date.now() + getRefreshCookieMaxAgeMs());

const assertLoginFields = (email, password) => {
  if (!email || !password) throw new AppError("All fields are required", 400);
};

const MAX_SESSIONS = 5;

const login = async (req, email, password) => {
  assertLoginFields(email, password);
  const user = await User.findOne({ email: email.toLowerCase(), _includeInactive: true })
    .select("+password +refreshToken +refreshTokens");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid credentials", 401);
  }
  if (user.isActive === false) {
    throw new AppError("Account has been deactivated. Contact your administrator.", 403);
  }
  const accessToken = generateAccessToken(user);
  const newRefresh = generateRefreshToken(user);
  const tokenHash = hashRefreshToken(newRefresh);
  const now = new Date();
  const exp = getSessionExpiresAt();
  user.removeExpiredSessions();
  user.refreshToken = newRefresh;
  user.refreshTokens = user.refreshTokens || [];
  user.refreshTokens.push({
    token: tokenHash,
    deviceInfo: getDeviceInfo(req),
    ipAddress: getClientIp(req),
    createdAt: now,
    lastUsedAt: now,
    expiresAt: exp,
  });
  user.refreshTokens.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  while (user.refreshTokens.length > MAX_SESSIONS) {
    user.refreshTokens.shift();
  }
  try {
    await user.save();
  } catch (err) {
    console.error("Session persist failed:", err.message);
    throw new AppError("Login failed", 500);
  }
  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken: newRefresh,
    userDoc: user,
  };
};

const findSessionIndexByTokenHash = (user, hash) => {
  if (!user.refreshTokens?.length) return -1;
  return user.refreshTokens.findIndex((s) => s.token === hash);
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError("Refresh token missing", 401);
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findOne({ _id: decoded.id, _includeInactive: true }).select(
      "+refreshToken +refreshTokens"
    );
    if (!user) throw new AppError("Invalid refresh token", 403);
    if (user.isActive === false) throw new AppError("Account has been deactivated", 403);
    const h = hashRefreshToken(refreshToken);
    let u = user;
    let sessionIdx = findSessionIndexByTokenHash(u, h);
    if (sessionIdx === -1) {
      if (u.refreshToken === refreshToken) {
        u.removeExpiredSessions();
        const now = new Date();
        const exp = getSessionExpiresAt();
        if (!u.refreshTokens) u.refreshTokens = [];
        u.refreshTokens.push({
          token: h,
          deviceInfo: "",
          ipAddress: "",
          createdAt: now,
          lastUsedAt: now,
          expiresAt: exp,
        });
        u.refreshToken = null;
        await u.save();
        u = await User.findById(u._id).select("+refreshToken +refreshTokens");
        sessionIdx = findSessionIndexByTokenHash(u, h);
      }
    }
    if (sessionIdx === -1) {
      throw new AppError("Invalid refresh token", 403);
    }
    const newAccessToken = generateAccessToken(u);
    const newRefresh = generateRefreshToken(u);
    const newHash = hashRefreshToken(newRefresh);
    const sess = u.refreshTokens[sessionIdx];
    sess.lastUsedAt = new Date();
    sess.token = newHash;
    sess.expiresAt = getSessionExpiresAt();
    u.refreshToken = newRefresh;
    await u.save();
    return { accessToken: newAccessToken, refreshToken: newRefresh };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("Invalid refresh token", 401);
  }
};

const logout = async (refreshToken, userId) => {
  try {
    if (userId && refreshToken) {
      const h = hashRefreshToken(refreshToken);
      await User.findByIdAndUpdate(userId, {
        $set: { refreshToken: null },
        $pull: { refreshTokens: { token: h } },
      });
      return;
    }
    if (userId) {
      await User.findByIdAndUpdate(userId, { $set: { refreshToken: null, refreshTokens: [] } });
      return;
    }
    if (refreshToken) {
      const h = hashRefreshToken(refreshToken);
      const u = await User.findOne({
        $or: [{ refreshToken }, { "refreshTokens.token": h }],
        _includeInactive: true,
      }).select("_id");
      if (u) {
        await User.findByIdAndUpdate(u._id, {
          $set: { refreshToken: null },
          $pull: { refreshTokens: { token: h } },
        });
      }
    }
  } catch (err) {
    console.error("Logout DB clear failed:", err.message);
  }
};

const logoutAllDevices = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    $set: { refreshToken: null, refreshTokens: [] },
  });
};

const getActiveSessions = async (req, userId) => {
  const currentCookie = req.cookies?.refreshToken;
  const currentHash = currentCookie ? hashRefreshToken(currentCookie) : null;
  const user = await User.findById(userId).select("+refreshTokens");
  if (!user) throw new AppError("User not found", 404);
  user.removeExpiredSessions();
  if (user.isModified("refreshTokens")) {
    await user.save();
  }
  const fresh = await User.findById(userId).select("+refreshTokens");
  return (fresh.refreshTokens || [])
    .filter((s) => s.expiresAt > new Date())
    .map((s) => ({
      id: s._id.toString(),
      deviceInfo: s.deviceInfo,
      ipAddress: s.ipAddress,
      createdAt: s.createdAt,
      lastUsedAt: s.lastUsedAt,
      expiresAt: s.expiresAt,
      isCurrent: currentHash != null && s.token === currentHash,
    }));
};

const logoutOneSession = async (req, userId, sessionId) => {
  if (!mongoose.isValidObjectId(sessionId)) {
    throw new AppError("Invalid session", 400);
  }
  const currentCookie = req.cookies?.refreshToken;
  const currentHash = currentCookie ? hashRefreshToken(currentCookie) : null;
  const user = await User.findById(userId).select("+refreshToken +refreshTokens");
  if (!user) throw new AppError("User not found", 404);
  const sub = (user.refreshTokens || []).find((s) => s._id.toString() === sessionId);
  if (!sub) throw new AppError("Session not found", 404);
  const oid = new mongoose.Types.ObjectId(sessionId);
  const revokedCurrent = currentHash != null && sub.token === currentHash;
  await User.findByIdAndUpdate(userId, { $pull: { refreshTokens: { _id: oid } } });
  if (revokedCurrent) {
    await User.findByIdAndUpdate(userId, { $set: { refreshToken: null } });
  }
  return { revokedCurrent };
};

const getMe = async (userId) => {
  const user = await User.findById(userId)
    .select("username email role profileImage isActive");
  if (!user) throw new AppError("User not found", 404);
  if (user.isActive === false) throw new AppError("Account has been deactivated", 403);
  return {
    id: user._id,
    role: user.role,
    username: user.username,
    email: user.email,
    profileImage: user.profileImage || "",
  };
};

const isValidImageUrl = (url) => {
  if (!url) return true;
  if (url === "") return true;
  try {
    const parsed = new URL(url);
    if (!["https:"].includes(parsed.protocol)) return false;
    const allowedHosts = ["res.cloudinary.com", "images.unsplash.com"];
    if (!allowedHosts.some((h) => parsed.hostname.endsWith(h))) return false;
    return true;
  } catch {
    return false;
  }
};

const GENERIC_NO_ACCOUNT_MESSAGE =
  "If an account exists for that email, a reset link can be generated. Contact an administrator if you do not see a link below.";

/**
 * Self-service: issue token, return link in response (no email).
 * Inactive or unknown email: generic message, no data.
 */
const requestPasswordReset = async (req, email) => {
  const normalized = (email || "").toLowerCase().trim();

  if (!normalized) {
    return { message: GENERIC_NO_ACCOUNT_MESSAGE, data: null };
  }

  const user = await User.findOne({ email: normalized, _includeInactive: true }).select(
    "+passwordResetTokenHash +passwordResetExpires"
  );

  if (!user || user.isActive === false) {
    return { message: GENERIC_NO_ACCOUNT_MESSAGE, data: null };
  }

  const { resetLink, expiresAt } = await savePasswordResetTokenAndGetLink(
    req,
    user,
    "auth.password_reset_requested"
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

/**
 * Validate that a reset token is still valid (UI step before showing the form).
 */
const validatePasswordResetToken = async (rawToken) => {
  if (!isValidResetTokenFormat(rawToken)) {
    throw new AppError("Invalid reset token format", 400);
  }
  const hash = hashResetToken(rawToken);
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) throw new AppError("Invalid or expired reset token", 400);
  return {
    valid: true,
    email: user.email,
    username: user.username,
    userId: user._id,
  };
};

/**
 * Complete password reset with a valid token.
 */
const resetPasswordWithToken = async (req, { token, password }) => {
  if (!isValidResetTokenFormat(token)) {
    throw new AppError("Invalid reset token format", 400);
  }
  const hash = hashResetToken(token);
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password +refreshToken +refreshTokens");

  if (!user) throw new AppError("Invalid or expired reset token", 400);

  user.password = password;
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  user.refreshToken = null;
  user.refreshTokens = [];
  await user.save();

  log("auth.password_reset_completed", req, "User", user._id, { email: user.email }, {
    actorId: user._id,
    actorRole: user.role,
  });

  return {
    message: "Password has been reset. You can sign in with your new password.",
  };
};

const updateProfile = async (req, userId, { username, profileImage }) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found", 404);
  const updatedFields = [];
  if (username) {
    user.username = username.trim();
    updatedFields.push("username");
  }
  if (profileImage !== undefined) {
    if (profileImage === "") {
      user.profileImage = "";
      updatedFields.push("profileImage");
    } else if (!isValidImageUrl(profileImage)) {
      throw new AppError("Invalid image URL. Only HTTPS Cloudinary URLs are allowed.", 400);
    } else {
      user.profileImage = profileImage;
      updatedFields.push("profileImage");
    }
  }
  await user.save();
  log("user.profile.update", req, "User", userId, { userId, updatedFields });
  return {
    id: user._id,
    role: user.role,
    username: user.username,
    email: user.email,
    profileImage: user.profileImage || "",
  };
};

module.exports = {
  getRegistrationStatus,
  getCookieOptions,
  getClearCookieOptions,
  getRefreshCookieMaxAgeMs,
  login,
  refreshAccessToken,
  logout,
  logoutAllDevices,
  getActiveSessions,
  logoutOneSession,
  getMe,
  updateProfile,
  requestPasswordReset,
  validatePasswordResetToken,
  resetPasswordWithToken,
  savePasswordResetTokenAndGetLink,
};
