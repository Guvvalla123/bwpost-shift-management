// authController.js
// This file handles all authentication.
// Login, logout, register, forgot password,
// reset password and token refresh.
//
// ROUTES THAT USE THIS CONTROLLER:
// POST /api/users/login
// POST /api/users/logout
// POST /api/users/refresh-token
// GET  /api/users/me
// PUT  /api/users/profile
// POST /api/users/forgot-password
// GET  /api/users/reset-password/validate/:token
// POST /api/users/reset-password
// POST /api/users/onesignal-player-id

const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { log } = require("../helpers/auditLogger");
const { sendSuccess } = require("../helpers/sendResponse");
const { getFrontendBaseUrl } = require("../helpers/frontendUrl");

// ─── PRIVATE HELPER FUNCTIONS ─────────────────────────────────────────────────
// These are used inside this file only. Not exported.

// Check that a reset token string is 64 hex characters
const isValidResetTokenFormat = (t) =>
  typeof t === "string" && /^[a-f0-9]{64}$/i.test(t);

// Hash a raw token using SHA256 before storing it in the database
// We never store the raw token, only the hash
const hashResetToken = (rawToken) =>
  crypto.createHash("sha256").update(rawToken).digest("hex");

// Read the password reset TTL from .env or default to 1 hour
const getPasswordResetTtlMs = () => {
  const raw = process.env.PASSWORD_RESET_EXPIRE_MS;
  const n = raw ? parseInt(raw, 10) : NaN;
  if (Number.isFinite(n) && n > 0) return n;
  return 60 * 60 * 1000;
};

// Create a signed JWT access token for a user
// The access token expires in 15 minutes
const generateAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

// Create a signed JWT refresh token for a user
// The refresh token has a longer lifetime (default 8 hours)
const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "8h" }
  );

// How long the refresh token cookie lives in the browser (8 hours in ms)
const getRefreshCookieMaxAgeMs = () => 8 * 60 * 60 * 1000;

// Build cookie options with correct secure/sameSite flags for prod vs dev
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

// Build cookie-clearing options (no maxAge, so browser deletes the cookie)
const getClearCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
};

// Hash a refresh token with SHA256 before storing in the database
const hashRefreshToken = (raw) =>
  crypto.createHash("sha256").update(raw, "utf8").digest("hex");

// Get the real IP address from the request (handles proxies)
const getClientIp = (req) => {
  const x = req.get("x-forwarded-for");
  if (x) return x.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "";
};

// Get the browser/device info from the request
const getDeviceInfo = (req) => (req.get("user-agent") || "").slice(0, 512);

// Calculate when the current session expires
const getSessionExpiresAt = () => new Date(Date.now() + getRefreshCookieMaxAgeMs());

// Throw an error if email or password is missing
const assertLoginFields = (email, password) => {
  if (!email || !password) throw new AppError("All fields are required", 400);
};

// Find which session in the array matches this hashed refresh token
const findSessionIndexByTokenHash = (user, hash) => {
  if (!user.refreshTokens?.length) return -1;
  return user.refreshTokens.findIndex((s) => s.token === hash);
};

// Validate that a profile image URL is from an allowed HTTPS host
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

// Maximum number of active sessions per user (oldest is removed when exceeded)
const MAX_SESSIONS = 5;

// Message returned when we cannot confirm if an email exists
// Vague on purpose so we do not leak which emails are registered
const GENERIC_NO_ACCOUNT_MESSAGE =
  "If an account exists for that email, a reset link can be generated. Contact an administrator if you do not see a link below.";

// ─── EXPORTED UTILITY (used by adminController and employeeController) ─────────

// createResetLink
// Generates a secure reset token, hashes it, stores it on the user,
// and returns the plain token link to be shared.
// Used by: forgotPassword, admin reset link, manager reset link.
const createResetLink = async (req, user, auditEventName) => {
  // Generate a random 32-byte hex token (64 characters)
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Calculate when this reset link expires
  const expiresAt = new Date(Date.now() + getPasswordResetTtlMs());

  // Store only the hashed version in the database for security
  user.passwordResetTokenHash = hashResetToken(rawToken);
  user.passwordResetExpires = expiresAt;
  await user.save();

  // Build the full reset URL that will be sent to the user
  const resetLink = `${getFrontendBaseUrl()}/reset-password?token=${rawToken}`;

  // Log this action in the audit trail
  if (auditEventName) {
    log(auditEventName, req, "User", user._id, { email: user.email }, {
      actorId: req.user ? req.user.id : user._id,
      actorRole: req.user ? req.user.role : user.role,
    });
  }

  return { resetLink, expiresAt };
};

// ─── ROUTE HANDLER FUNCTIONS ──────────────────────────────────────────────────

// getRegistrationStatus - returns whether public registration is allowed
// Public registration is disabled in this app, invites are used instead
const getRegistrationStatus = (req, res) => {
  try {
    return sendSuccess(res, 200, { data: { publicRegistrationEnabled: false } });
  } catch {
    return sendSuccess(res, 200, { data: { publicRegistrationEnabled: false } });
  }
};

// registerUser - public registration is disabled
// All users must register using an invite link from an admin or manager
const registerUser = asyncHandler(async () => {
  throw new AppError(
    "Public registration is disabled. Please use an invite link from your administrator.",
    403
  );
});

// login - handles the login request
// Gets email and password from request body
// Checks if user exists and password is correct
// Creates access and refresh tokens
// Stores tokens in HTTP-only cookies
// Returns user data to frontend
const login = asyncHandler(async (req, res) => {
  // Get email and password from the request body
  const { email, password } = req.body;

  // Validate that both fields are present
  assertLoginFields(email, password);

  // Find the user in the database (include inactive to show correct error)
  const user = await User.findOne({ email: email.toLowerCase(), _includeInactive: true })
    .select("+password +refreshToken +refreshTokens");

  // If user not found or password wrong, send generic error (do not reveal which)
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid credentials", 401);
  }

  // If user account is deactivated, block login
  if (user.isActive === false) {
    throw new AppError("Account has been deactivated. Contact your administrator.", 403);
  }

  // Create a new access token (short-lived, 15 minutes)
  const accessToken = generateAccessToken(user);

  // Create a new refresh token (longer-lived, 8 hours)
  const newRefresh = generateRefreshToken(user);

  // Hash the refresh token before storing in database
  const tokenHash = hashRefreshToken(newRefresh);

  const now = new Date();
  const exp = getSessionExpiresAt();

  // Remove any expired sessions before adding the new one
  user.removeExpiredSessions();
  user.refreshToken = newRefresh;
  user.refreshTokens = user.refreshTokens || [];

  // Add this new session to the sessions list
  user.refreshTokens.push({
    token: tokenHash,
    deviceInfo: getDeviceInfo(req),
    ipAddress: getClientIp(req),
    createdAt: now,
    lastUsedAt: now,
    expiresAt: exp,
  });

  // Sort sessions by creation time (oldest first)
  user.refreshTokens.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  // If too many sessions, remove the oldest one
  while (user.refreshTokens.length > MAX_SESSIONS) {
    user.refreshTokens.shift();
  }

  // Save updated session list to database
  try {
    await user.save();
  } catch (err) {
    console.error("Session persist failed:", err.message);
    throw new AppError("Login failed", 500);
  }

  // Log the successful login in the audit trail
  log(
    "auth.login",
    req,
    "User",
    user._id,
    { email: user.email, role: user.role },
    { actorId: user._id, actorRole: user.role }
  );

  // Set the access token cookie (15 minutes)
  res.cookie("token", accessToken, getCookieOptions(15 * 60 * 1000));

  // Set the refresh token cookie (8 hours)
  res.cookie("refreshToken", newRefresh, getCookieOptions(getRefreshCookieMaxAgeMs()));

  return sendSuccess(res, 200, {
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    },
  });
});

// logout - handles the logout request
// Removes the refresh token from the database
// Clears both cookies from the browser
const logout = asyncHandler(async (req, res) => {
  // Get the refresh token from the cookie
  const refreshToken = req.cookies?.refreshToken;

  // Get the user ID from the auth middleware result
  const userId = req.user?.id;

  // Remove the session from the database
  try {
    if (userId && refreshToken) {
      // Hash the token to match the stored hash in the database
      const h = hashRefreshToken(refreshToken);
      await User.findByIdAndUpdate(userId, {
        $set: { refreshToken: null },
        $pull: { refreshTokens: { token: h } },
      });
    } else if (userId) {
      // If no token just clear all sessions for this user
      await User.findByIdAndUpdate(userId, { $set: { refreshToken: null, refreshTokens: [] } });
    } else if (refreshToken) {
      // If no userId, find user by refresh token
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

  // Clear both cookies from the browser
  const clearOpts = getClearCookieOptions();
  res.clearCookie("token", clearOpts);
  res.clearCookie("refreshToken", clearOpts);

  return sendSuccess(res, 200, { message: "Logged out successfully" });
});

// refreshToken - creates a new access token using the refresh token
// Called automatically by the frontend when the access token expires
const refreshToken = asyncHandler(async (req, res) => {
  // Get the refresh token from the cookie
  const currentRefreshToken = req.cookies?.refreshToken;

  // Throw error if refresh token is missing
  if (!currentRefreshToken) throw new AppError("Refresh token missing", 401);

  try {
    // Verify the refresh token signature
    const decoded = jwt.verify(currentRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find the user (include inactive to give correct error)
    const user = await User.findOne({ _id: decoded.id, _includeInactive: true }).select(
      "+refreshToken +refreshTokens"
    );

    if (!user) throw new AppError("Invalid refresh token", 403);
    if (user.isActive === false) throw new AppError("Account has been deactivated", 403);

    // Hash the incoming token to match against stored hashes
    const h = hashRefreshToken(currentRefreshToken);
    let u = user;
    let sessionIdx = findSessionIndexByTokenHash(u, h);

    // If session not found, try migrating the old single-token field
    if (sessionIdx === -1) {
      if (u.refreshToken === currentRefreshToken) {
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

    // If still not found the token is invalid
    if (sessionIdx === -1) {
      throw new AppError("Invalid refresh token", 403);
    }

    // Issue new access and refresh tokens (token rotation)
    const newAccessToken = generateAccessToken(u);
    const newRefresh = generateRefreshToken(u);
    const newHash = hashRefreshToken(newRefresh);

    // Update the session with the new token hash and expiry
    const sess = u.refreshTokens[sessionIdx];
    sess.lastUsedAt = new Date();
    sess.token = newHash;
    sess.expiresAt = getSessionExpiresAt();
    u.refreshToken = newRefresh;
    await u.save();

    // Set the new tokens as cookies
    res.cookie("token", newAccessToken, getCookieOptions(15 * 60 * 1000));
    res.cookie("refreshToken", newRefresh, getCookieOptions(getRefreshCookieMaxAgeMs()));

    return sendSuccess(res, 200, { message: "Token refreshed" });
  } catch (e) {
    if (e instanceof AppError) throw e;
    throw new AppError("Invalid refresh token", 401);
  }
});

// getMyProfile - returns the logged in user's profile data
// Used by the frontend to show user info in the header
const getMyProfile = asyncHandler(async (req, res) => {
  // Find the user by ID from the token
  const user = await User.findById(req.user.id)
    .select("username email role profileImage isActive");

  if (!user) throw new AppError("User not found", 404);
  if (user.isActive === false) throw new AppError("Account has been deactivated", 403);

  return sendSuccess(res, 200, {
    data: {
      id: user._id,
      role: user.role,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage || "",
    },
  });
});

// updateMyProfile - updates the logged in user's profile
// Allows changing username and profile image URL
const updateMyProfile = asyncHandler(async (req, res) => {
  // Get the fields to update from the request body
  const { username, profileImage } = req.body;

  // Find the user to update
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError("User not found", 404);

  // Track which fields were changed for the audit log
  const updatedFields = [];

  // Update username if provided
  if (username) {
    user.username = username.trim();
    updatedFields.push("username");
  }

  // Update profile image if provided
  if (profileImage !== undefined) {
    if (profileImage === "") {
      // Allow clearing the profile image
      user.profileImage = "";
      updatedFields.push("profileImage");
    } else if (!isValidImageUrl(profileImage)) {
      throw new AppError("Invalid image URL. Only HTTPS Cloudinary URLs are allowed.", 400);
    } else {
      user.profileImage = profileImage;
      updatedFields.push("profileImage");
    }
  }

  // Save changes to database
  await user.save();

  // Log the profile update
  log("user.profile.update", req, "User", req.user.id, { userId: req.user.id, updatedFields });

  return sendSuccess(res, 200, {
    message: "Profile updated",
    data: {
      id: user._id,
      role: user.role,
      username: user.username,
      email: user.email,
      profileImage: user.profileImage || "",
    },
  });
});

// forgotPassword - generates a password reset link
// Used when user clicks "Forgot Password" on the login page
const forgotPassword = asyncHandler(async (req, res) => {
  // Get the email from the request body
  const normalized = (req.body.email || "").toLowerCase().trim();

  // Return generic message if email is empty (do not reveal info)
  if (!normalized) {
    return sendSuccess(res, 200, { message: GENERIC_NO_ACCOUNT_MESSAGE, data: null });
  }

  // Find the user by email (include inactive users to show correct error)
  const user = await User.findOne({ email: normalized, _includeInactive: true }).select(
    "+passwordResetTokenHash +passwordResetExpires"
  );

  // If user not found or deactivated, return generic message
  if (!user || user.isActive === false) {
    return sendSuccess(res, 200, { message: GENERIC_NO_ACCOUNT_MESSAGE, data: null });
  }

  // Generate the reset token and save it to the user
  const { resetLink, expiresAt } = await createResetLink(
    req,
    user,
    "auth.password_reset_requested"
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

// validateResetToken - checks if a password reset token is still valid
// Called when the user opens the reset password page
const validateResetToken = asyncHandler(async (req, res) => {
  const rawToken = req.params.token;

  // Validate the format of the token before querying the database
  if (!isValidResetTokenFormat(rawToken)) {
    throw new AppError("Invalid reset token format", 400);
  }

  // Hash the raw token to match against what is stored in the database
  const hash = hashResetToken(rawToken);

  // Find a user with this token hash that has not expired yet
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  });

  if (!user) throw new AppError("Invalid or expired reset token", 400);

  return sendSuccess(res, 200, {
    data: {
      valid: true,
      email: user.email,
      username: user.username,
      userId: user._id,
    },
  });
});

// resetPassword - sets a new password using a valid reset token
// Called when user submits the new password form
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  // Validate token format first
  if (!isValidResetTokenFormat(token)) {
    throw new AppError("Invalid reset token format", 400);
  }

  // Hash the token to look up in the database
  const hash = hashResetToken(token);

  // Find the user with this valid non-expired token
  const user = await User.findOne({
    passwordResetTokenHash: hash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+password +refreshToken +refreshTokens");

  if (!user) throw new AppError("Invalid or expired reset token", 400);

  // Set the new password (the User model will hash it on save)
  user.password = password;

  // Clear the reset token so it cannot be reused
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;

  // Log out all sessions so old sessions cannot be reused
  user.refreshToken = null;
  user.refreshTokens = [];

  await user.save();

  // Log the successful password reset
  log("auth.password_reset_completed", req, "User", user._id, { email: user.email }, {
    actorId: user._id,
    actorRole: user.role,
  });

  return sendSuccess(res, 200, {
    message: "Password has been reset. You can sign in with your new password.",
  });
});

// getActiveSessions - returns all active sessions for the logged in user
// Shows where the user is logged in (device info, IP, etc)
const getActiveSessions = asyncHandler(async (req, res) => {
  // Get the current session's refresh token to mark it as current
  const currentCookie = req.cookies?.refreshToken;
  const currentHash = currentCookie ? hashRefreshToken(currentCookie) : null;

  // Find the user and include their sessions list
  const user = await User.findById(req.user.id).select("+refreshTokens");
  if (!user) throw new AppError("User not found", 404);

  // Remove expired sessions before returning
  user.removeExpiredSessions();
  if (user.isModified("refreshTokens")) {
    await user.save();
  }

  // Re-fetch to get the latest clean list
  const fresh = await User.findById(req.user.id).select("+refreshTokens");

  // Return each active session with a flag marking the current one
  const data = (fresh.refreshTokens || [])
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

  return sendSuccess(res, 200, { data });
});

// logoutAllDevices - logs out from every device at once
// Clears all refresh token sessions stored for this user
const logoutAllDevices = asyncHandler(async (req, res) => {
  // Remove all sessions for this user
  await User.findByIdAndUpdate(req.user.id, {
    $set: { refreshToken: null, refreshTokens: [] },
  });

  // Clear the current browser's cookies too
  const clearOpts = getClearCookieOptions();
  res.clearCookie("token", clearOpts);
  res.clearCookie("refreshToken", clearOpts);

  return sendSuccess(res, 200, { message: "Logged out from all devices" });
});

// logoutOneSession - logs out a specific session by its ID
// Used when user clicks "Remove" next to a session in the sessions list
const logoutOneSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  // Validate that the session ID is a valid MongoDB ID
  if (!mongoose.isValidObjectId(sessionId)) {
    throw new AppError("Invalid session", 400);
  }

  // Check if the session being removed is the current one
  const currentCookie = req.cookies?.refreshToken;
  const currentHash = currentCookie ? hashRefreshToken(currentCookie) : null;

  // Find the user and their sessions
  const user = await User.findById(req.user.id).select("+refreshToken +refreshTokens");
  if (!user) throw new AppError("User not found", 404);

  // Find the session to remove
  const sub = (user.refreshTokens || []).find((s) => s._id.toString() === sessionId);
  if (!sub) throw new AppError("Session not found", 404);

  // Remove the session from the database
  const oid = new mongoose.Types.ObjectId(sessionId);
  const revokedCurrent = currentHash != null && sub.token === currentHash;
  await User.findByIdAndUpdate(req.user.id, { $pull: { refreshTokens: { _id: oid } } });

  // If we removed the current session, also clear the legacy token field
  if (revokedCurrent) {
    await User.findByIdAndUpdate(req.user.id, { $set: { refreshToken: null } });
    // Clear cookies since this session is now invalid
    const clearOpts = getClearCookieOptions();
    res.clearCookie("token", clearOpts);
    res.clearCookie("refreshToken", clearOpts);
  }

  return sendSuccess(res, 200, { message: "Session removed" });
});

module.exports = {
  // Route handlers
  registerUser,
  login,
  logout,
  refreshToken,
  getMyProfile,
  updateMyProfile,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getRegistrationStatus,
  getActiveSessions,
  logoutAllDevices,
  logoutOneSession,
  // Utility exported for use by adminController and employeeController
  createResetLink,
};
