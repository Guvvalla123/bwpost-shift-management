// inviteRoutes.js
// These routes handle the invite system.
// Admin or manager creates invite links.
// New users register using invite links.
//
// BASE URL: /api/invites
//
// HOW INVITES WORK:
// 1. Admin or manager creates an invite via POST /api/invites
// 2. System generates a unique random token and returns a registration URL
// 3. Admin copies the link and sends it to the new employee via WhatsApp, email, etc.
// 4. Employee opens the link and the frontend calls GET /api/invites/validate/:token
// 5. If token is valid the registration form is shown
// 6. Employee fills out the form and submits to POST /api/invites/accept
// 7. Account is created and the invite is marked as used
//
// PUBLIC ROUTES (no login needed):
// GET  /api/invites/validate/:token    - check if invite token is valid
// POST /api/invites/accept             - register using an invite token
//
// PROTECTED ROUTES (must be logged in as admin or manager):
// GET  /api/invites                    - list all invites
// POST /api/invites                    - create a new invite

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const AppError = require("../helpers/AppError");
const { isLoggedIn } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/checkRole");
const validateInput = require("../middleware/validateInput");
const { createInvite, validateInvite, acceptInvite, getAllInvites } = require("../controllers/inviteController");
const { createInviteSchema, acceptInviteSchema } = require("../validation/inviteValidation");

// Rate limiter for public invite routes
// Prevents abuse of the public registration endpoints
const invitePublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new AppError("Too many attempts, try again later", options.statusCode));
  },
});

// GET /api/invites/validate/:token
// Public route — no login needed
// Frontend calls this when the new user opens their invite link
// Returns whether the token is valid, expired, or already used
router.get("/validate/:token", invitePublicLimiter, validateInvite);

// POST /api/invites/accept
// Public route — no login needed
// New employee submits the registration form along with the invite token
// Creates their account and marks the invite as used
router.post("/accept", invitePublicLimiter, validateInput(acceptInviteSchema), acceptInvite);

// GET /api/invites
// Protected — must be logged in as admin or manager
// Returns all invite records showing pending, used, and expired invites
router.get("/", isLoggedIn, checkRole("admin", "manager"), getAllInvites);

// POST /api/invites
// Protected — must be logged in as admin or manager
// Creates a new invite and returns the registration link
// Admin copies this link and sends it to the new employee
router.post("/", isLoggedIn, checkRole("admin", "manager"), validateInput(createInviteSchema), createInvite);

module.exports = router;
