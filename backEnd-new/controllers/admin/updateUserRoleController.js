// updateUserRoleController.js
// Route: PUT /api/admin/users/:userId/role
// Who: admin only
// Moves users between RBAC buckets and fixes manager linkage.

const User = require("../../models/User");

const {
  sendSuccess,
  sendError,
} = require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

// updateUserRoleController - adjusts role wiring safely
async function updateUserRoleController(
  req,
  res,
  next
) {
  try {
    const { userId } = req.params;

    const { role, managerId } = req.body;

    const user =
      await User.findById(userId);

    if (!user) {
      return sendError(res, 404, "User not found");
    }

    if (
      role === "employee"
    ) {
      if (!managerId) {
        return sendError(
          res,
          400,
          "managerId is required when role is employee"
        );
      }

      const mgr =
        await User.findById(
          managerId
        ).select("role");

      if (
        !mgr ||
        mgr.role !== "manager"
      ) {
        return sendError(
          res,
          400,
          "managerId must reference an existing manager"
        );
      }

      user.role = "employee";

      user.managerId = managerId;
    } else if (
      role === "manager" ||
      role === "admin"
    ) {
      // Promoted profiles no longer report to managers
      user.role = role;

      user.managerId = undefined;
    } else {
      return sendError(
        res,
        400,
        "Unsupported role value"
      );
    }

    await user.save();

    await saveAuditLog(
      "user.role_changed",
      req.user.id,

      req.user.role,

      {
        targetUserId: user._id,

        newRole: role,
      },

      req.ip
    );

    const fresh = await User.findById(user._id)
      .select(
        "-password -refreshToken"
      );

    return sendSuccess(
      res,

      200,

      "User role updated",

      {
        user: fresh,
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports =
  updateUserRoleController;
