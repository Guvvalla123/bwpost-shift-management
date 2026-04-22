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
  saveOneSignalPlayerId,
  getRegistrationStatus,
  forgotPassword,
  validateResetPasswordToken,
  resetPassword,
} = require('../controllers/userController');
const validate = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
  oneSignalPlayerIdSchema,
} = require('../validators/uservalidators');
const { auth } = require('../middlewares/authMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new AppError("Too many attempts, please try again after 15 minutes", options.statusCode));
  },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    message: "Too many refresh attempts, please try again later",
  },
});

// Registration status (public - for frontend to show/hide Register link)
router.get('/registration-status', getRegistrationStatus);

// User registration route
router.post('/register', authLimiter, validate(registerSchema), registerUser);

// User login route
router.post('/login', authLimiter, validate(loginSchema), loginUser);

// Password reset (public; token emailed later via AWS SES/SNS)
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.get('/reset-password/validate/:token', authLimiter, validateResetPasswordToken);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

// User logout route
router.post('/logout', logoutUser);

// Refresh token route
router.post('/refresh-token', refreshLimiter, refreshAccessToken);

// Get current user
router.get('/me', auth, getMe);

// Update profile (username + profileImage)
router.put('/profile', auth, validate(updateProfileSchema), updateProfile);

// OneSignal web push subscription id (per browser)
router.post(
  '/onesignal-player-id',
  auth,
  validate(oneSignalPlayerIdSchema),
  saveOneSignalPlayerId
);

module.exports = router;
