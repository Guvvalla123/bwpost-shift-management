const express = require('express');
const router = express.Router();

const { registerUser, loginUser, logoutUser, refreshAccessToken, getMe } = require('../controllers/userController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validators/uservalidators');
const { auth } = require('../middlewares/authMiddleware');


// User registration route
router.post('/register', validate(registerSchema), registerUser);

// User login route
router.post('/login', validate(loginSchema), loginUser);

//user logout route
router.post('/logout', logoutUser);

//refresh token route
router.post('/refresh-token', refreshAccessToken);

//getMe route
router.get('/me', auth, getMe);

module.exports = router;
