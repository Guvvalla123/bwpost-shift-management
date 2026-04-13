const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const AppError = require("../utils/AppError");
const { createInvite, validateInvite, acceptInvite, getAllInvites } = require("../controllers/inviteController");
const { auth, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { createInviteSchema, acceptInviteSchema } = require("../validators/inviteValidators");

const invitePublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    next(new AppError("Too many attempts, try again later", options.statusCode));
  },
});

// Public (no auth) - rate limited
router.get("/validate/:token", invitePublicLimiter, validateInvite);
router.post("/accept", invitePublicLimiter, validate(acceptInviteSchema), acceptInvite);

// Protected
router.get("/", auth, authorize("admin", "manager"), getAllInvites);
router.post("/", auth, authorize("admin", "manager"), validate(createInviteSchema), createInvite);

module.exports = router;
