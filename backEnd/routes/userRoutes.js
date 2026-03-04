const express = require('express');
const router = express.Router();

const { registerUser, loginUser, logoutUser, refreshAccessToken, getMe, updateProfile } = require('../controllers/userController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/uservalidators');
const { auth } = require('../middlewares/authMiddleware');


// User registration route
router.post('/register', validate(registerSchema), registerUser);

// User login route
router.post('/login', validate(loginSchema), loginUser);

// User logout route
router.post('/logout', logoutUser);

// Refresh token route
router.post('/refresh-token', refreshAccessToken);

// Get current user
router.get('/me', auth, getMe);

// Update profile (username + profileImage)
router.put('/profile', auth, updateProfile);

module.exports = router;
