const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const { registerUser, loginUser, logoutUser, refreshAccessToken, getMe, updateProfile } = require('../controllers/userController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/uservalidators');
const { auth } = require('../middlewares/authMiddleware');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts, please try again after 15 minutes",
  standardHeaders: true,
  legacyHeaders: false,
});

// User registration route
router.post('/register', authLimiter, validate(registerSchema), registerUser);

// User login route
router.post('/login', authLimiter, validate(loginSchema), loginUser);

// User logout route
router.post('/logout', logoutUser);

// Refresh token route
router.post('/refresh-token', refreshAccessToken);

// Get current user
router.get('/me', auth, getMe);

// Update profile (username + profileImage)
router.put('/profile', auth, updateProfile);

module.exports = router;
