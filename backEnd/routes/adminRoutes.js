// adminRoutes.js
// These routes are for admin only.
// Managing users and viewing audit logs.
//
// BASE URL: /api/admin
//
// ALL ROUTES REQUIRE:
// isLoggedIn and checkRole("admin")
//
// AVAILABLE ROUTES:
// GET  /api/admin/users                              - list all users in the system
// POST /api/admin/users                              - create a user directly
// PUT  /api/admin/users/:userId/role                 - change a user's role
// POST /api/admin/users/:userId/reset-password-link  - generate password reset link
// GET  /api/admin/audit-logs                         - view audit log records

const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/checkRole");
const validateInput = require("../middleware/validateInput");

const {
  createUser,
  getAllUsers,
  updateUserRole,
  generateResetLink,
  getAuditLogs,
} = require("../controllers/adminController");

const { createUserSchema, updateUserRoleSchema } = require("../validation/adminValidation");

// Apply isLoggedIn and admin role check to every route in this file
// No route here can be accessed without being an admin
router.use(isLoggedIn, checkRole("admin"));

// GET /api/admin/users
// Admin views all users in the system (all roles)
// Used to manage accounts and see the full user list
router.get("/users", getAllUsers);

// GET /api/admin/audit-logs
// Admin views the audit log to see who did what and when
// Tracks important actions like role changes and password resets
router.get("/audit-logs", getAuditLogs);

// POST /api/admin/users
// Admin creates a new user account directly without an invite link
// Useful for quickly setting up admin accounts
router.post("/users", validateInput(createUserSchema), createUser);

// PUT /api/admin/users/:userId/role
// Admin changes a user's role (e.g., employee → manager)
// Role change is logged in the audit trail
router.put("/users/:userId/role", validateInput(updateUserRoleSchema), updateUserRole);

// POST /api/admin/users/:userId/reset-password-link
// Admin generates a password reset link for any user
// Admin copies the link and sends it to the user directly
router.post("/users/:userId/reset-password-link", generateResetLink);

module.exports = router;
