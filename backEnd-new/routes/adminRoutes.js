// adminRoutes.js
// BASE URL: /api/admin
//
// Strictly admin JWT traffic only.

const express = require("express");

const router = express.Router();

const { check } = require("express-validator");

const isLoggedIn =
  require("../middleware/isLoggedIn");

const checkRole =
  require("../middleware/checkRole");

const validate =
  require("../middleware/validate");

const getAllUsersController =
  require("../controllers/admin/getAllUsersController");

const createUserController =
  require("../controllers/admin/createUserController");

const updateUserRoleController =
  require("../controllers/admin/updateUserRoleController");

const generateResetLinkController =
  require("../controllers/admin/generateResetLinkController");

const getAuditLogsController =
  require("../controllers/admin/getAuditLogsController");

const guardAdmin = [
  isLoggedIn,

  checkRole("admin"),
];

router.get(
  "/users",

  guardAdmin,

  getAllUsersController
);

router.post(
  "/users",

  guardAdmin,

  [
    check("username")
      .isLength({ min: 2 })

      .withMessage(
        "Username must be at least 2 characters"
      ),

    check("email")
      .isEmail()
      .withMessage(
        "A valid email is required"
      ),

    check("password")
      .isLength({ min: 8 })

      .withMessage(
        "Password must be at least 8 characters"
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

  createUserController
);

router.put(
  "/users/:userId/role",

  guardAdmin,

  [
    check("role")
      .notEmpty()

      .isIn(["admin", "manager", "employee"])

      .withMessage(
        "role must be admin manager or employee"
      ),

    check("managerId").optional(),

    validate,
  ],

  updateUserRoleController
);

router.post(
  "/users/:userId/reset-password-link",

  guardAdmin,

  generateResetLinkController
);

router.get(
  "/audit-logs",

  guardAdmin,

  getAuditLogsController
);

module.exports = router;
