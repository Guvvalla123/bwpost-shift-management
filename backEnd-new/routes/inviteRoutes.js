// inviteRoutes.js
// BASE URL: /api/invites
//
// Public validators run without auth.
// Protected list/create require admin OR manager cookie.

const express = require("express");

const router = express.Router();

const { check } = require("express-validator");

const isLoggedIn =
  require("../middleware/isLoggedIn");

const checkRole =
  require("../middleware/checkRole");

const validate =
  require("../middleware/validate");

const createInviteController =
  require("../controllers/invites/createInviteController");

const getAllInvitesController =
  require("../controllers/invites/getAllInvitesController");

const validateInviteController =
  require("../controllers/invites/validateInviteController");

const acceptInviteController =
  require("../controllers/invites/acceptInviteController");

// Invite deep-link verification for registration screen
router.get(
  "/validate/:token",

  validateInviteController
);

router.post(
  "/accept",

  [
    check("token")
      .notEmpty()
      .withMessage("Token is required"),

    check("username")
      .isLength({ min: 2 })

      .withMessage(
        "Username must be at least 2 characters"
      ),

    check("password")
      .isLength({ min: 8 })

      .withMessage(
        "Password must be at least 8 characters"
      ),

    validate,
  ],

  acceptInviteController
);

const guardInvite = [
  isLoggedIn,

  checkRole("admin", "manager"),
];

router.get(
  "/",

  guardInvite,

  getAllInvitesController
);

router.post(
  "/",

  guardInvite,

  [
    check("email")
      .isEmail()
      .withMessage(
        "A valid email is required"
      ),

    check("role")
      .notEmpty()

      .isIn(["admin", "manager", "employee"])

      .withMessage(
        "role must be admin manager or employee"
      ),

    check("managerId").optional(),

    validate,
  ],

  createInviteController
);

module.exports = router;
