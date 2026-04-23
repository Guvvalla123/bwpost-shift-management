const express = require('express');
const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');
const router = express.Router();

const {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  getMe,
  updateProfile,
  getRegistrationStatus,
  forgotPassword,
  validateResetPasswordToken,
  resetPassword,
  getActiveSessions,
  logoutAllDevices,
  logoutOneSession,
} = require('../controllers/userController');
const validate = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} = require('../validators/uservalidators');
const { auth } = require('../middlewares/authMiddleware');
const { logEvent } = require('../utils/securityLog');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logEvent("rate_limit_auth", req, { window: "15m" });
    next(new AppError("Too many attempts, please try again after 15 minutes", options.statusCode));
  },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logEvent("rate_limit_refresh", req, { window: "15m" });
    next(new AppError("Too many refresh attempts, please try again later", options.statusCode));
  },
});

// Registration status (public - for frontend to show/hide Register link)
router.get('/registration-status', getRegistrationStatus);

// User registration route
router.post('/register', authLimiter, validate(registerSchema), registerUser);

// User login route
router.post('/login', authLimiter, validate(loginSchema), loginUser);

// Password reset (public; copy link, no email)
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.get('/reset-password/validate/:token', authLimiter, validateResetPasswordToken);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// User logout route
router.post('/logout', logoutUser);

// Refresh token route
router.post('/refresh-token', refreshLimiter, refreshAccessToken);

// Get current user
router.get('/me', auth, getMe);

router.get("/sessions", auth, getActiveSessions);
router.delete("/sessions", auth, logoutAllDevices);
router.delete("/sessions/:sessionId", auth, logoutOneSession);

// Update profile (username + profileImage)
router.put('/profile', auth, validate(updateProfileSchema), updateProfile);

module.exports = router;
