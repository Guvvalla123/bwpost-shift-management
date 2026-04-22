const { log } = require("../utils/auditLog");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const userService = require("../services/userService");

const getRegistrationStatus = (req, res) => {
  try {
    const data = userService.getRegistrationStatus();
    return sendSuccess(res, 200, { data });
  } catch {
    return sendSuccess(res, 200, { data: { publicRegistrationEnabled: false } });
  }
};

const registerUser = asyncHandler(async () => {
  throw new AppError(
    "Public registration is disabled. Please use an invite link from your administrator.",
    403
  );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await userService.login(email, password);
  log(
    "auth.login",
    req,
    "User",
    result.userDoc._id,
    { email: result.userDoc.email, role: result.userDoc.role },
    { actorId: result.userDoc._id, actorRole: result.userDoc.role }
  );
  res.cookie("token", result.accessToken, userService.getCookieOptions(15 * 60 * 1000));
  res.cookie(
    "refreshToken",
    result.refreshToken,
    userService.getCookieOptions(userService.getRefreshCookieMaxAgeMs())
  );
  return sendSuccess(res, 200, {
    message: "Login successful",
    data: { user: result.user },
  });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const tokens = await userService.refreshAccessToken(req.cookies?.refreshToken);
  res.cookie("token", tokens.accessToken, userService.getCookieOptions(15 * 60 * 1000));
  res.cookie(
    "refreshToken",
    tokens.refreshToken,
    userService.getCookieOptions(userService.getRefreshCookieMaxAgeMs())
  );
  return sendSuccess(res, 200, { message: "Token refreshed" });
});

const logoutUser = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  const userId = req.user?.id;

  await userService.logout(refreshToken, userId);

  const clearOpts = userService.getClearCookieOptions();
  res.clearCookie("token", clearOpts);
  res.clearCookie("refreshToken", clearOpts);

  return sendSuccess(res, 200, { message: "Logged out successfully" });
});

const getMe = asyncHandler(async (req, res) => {
  const data = await userService.getMe(req.user.id);
  return sendSuccess(res, 200, { data });
});

const updateProfile = asyncHandler(async (req, res) => {
  const data = await userService.updateProfile(req, req.user.id, req.body);
  return sendSuccess(res, 200, { message: "Profile updated", data });
});

const saveOneSignalPlayerId = asyncHandler(async (req, res) => {
  const { playerId } = req.body;
  const { message } = await userService.saveOneSignalPlayerId(req, req.user.id, playerId);
  return sendSuccess(res, 200, { message });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { message } = await userService.requestPasswordReset(req, req.body.email);
  return sendSuccess(res, 200, { message });
});

const validateResetPasswordToken = asyncHandler(async (req, res) => {
  const data = await userService.validatePasswordResetToken(req.params.token);
  return sendSuccess(res, 200, { data });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { message } = await userService.resetPasswordWithToken(req, req.body);
  return sendSuccess(res, 200, { message });
});

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getMe,
  updateProfile,
  saveOneSignalPlayerId,
  getRegistrationStatus,
  forgotPassword,
  validateResetPasswordToken,
  resetPassword,
};
