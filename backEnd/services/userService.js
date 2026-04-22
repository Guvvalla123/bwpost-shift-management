const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const { log } = require("../utils/auditLog");

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

const getFrontendBaseUrl = () => {
  const b = (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/$/, "");
  return b || "http://localhost:5173";
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

const assertLoginFields = (email, password) => {
  if (!email || !password) throw new AppError("All fields are required", 400);
};

const login = async (email, password) => {
  assertLoginFields(email, password);
  const user = await User.findOne({ email: email.toLowerCase(), _includeInactive: true })
    .select("+password +refreshToken");
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid credentials", 401);
  }
  if (user.isActive === false) {
    throw new AppError("Account has been deactivated. Contact your administrator.", 403);
  }
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);
  // Persist refresh token without user.save() — save() can re-run the password
  // pre-save hook when +password was selected (double-hash bug).
  await User.findByIdAndUpdate(
    user._id,
    { $set: { refreshToken } },
    { new: false }
  );
  return {
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
    userDoc: user,
  };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw new AppError("Refresh token missing", 401);
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findOne({ _id: decoded.id, _includeInactive: true }).select("+refreshToken");
    if (!user || user.refreshToken !== refreshToken) {
      throw new AppError("Invalid refresh token", 403);
    }
    if (user.isActive === false) throw new AppError("Account has been deactivated", 403);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    await User.findByIdAndUpdate(
      user._id,
      { $set: { refreshToken: newRefreshToken } },
      { new: false }
    );
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("Invalid refresh token", 401);
  }
};

const logout = async (refreshToken, userId) => {
  try {
    if (userId) {
      await User.findByIdAndUpdate(
        userId,
        { $set: { refreshToken: null } },
        { new: false }
      );
    } else if (refreshToken) {
      await User.findOneAndUpdate(
        { refreshToken },
        { $set: { refreshToken: null } },
        { new: false }
      );
    }
  } catch (err) {
    console.error("Logout DB clear failed:", err.message);
  }
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
  }).select("+password +refreshToken");

  if (!user) throw new AppError("Invalid or expired reset token", 400);

  user.password = password;
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  user.refreshToken = null;
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
  getMe,
  updateProfile,
  requestPasswordReset,
  validatePasswordResetToken,
  resetPasswordWithToken,
  savePasswordResetTokenAndGetLink,
};
