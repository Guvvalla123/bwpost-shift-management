const express = require("express");
const { auth, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const {
  createUser,
  getAllUsers,
  updateUserRole,
  generateUserPasswordResetLink,
  getAuditLogs,
} = require("../controllers/adminController");
const { createUserSchema, updateUserRoleSchema } = require("../validators/adminValidators");

const router = express.Router();

// All admin routes require admin role
router.use(auth, authorize("admin"));

router.get("/users", getAllUsers);
router.get("/audit-logs", getAuditLogs);
router.post("/users", validate(createUserSchema), createUser);
router.put("/users/:userId/role", validate(updateUserRoleSchema), updateUserRole);
router.post("/users/:userId/reset-password-link", generateUserPasswordResetLink);

module.exports = router;
