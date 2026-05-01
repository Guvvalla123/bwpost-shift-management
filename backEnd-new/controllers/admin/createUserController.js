// createUserController.js
// Route: POST /api/admin/users
// Who: admin only
// Direct user creation shortcut without invites.

const User = require("../../models/User");

const {
  sendSuccess,
  sendError,
} = require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

// createUserController - validates relations then persists
async function createUserController(
  req,
  res,
  next
) {
  try {
    const {
      username,
      email,
      password,
      role,
      managerId,
    } = req.body;

    const emailNorm = String(email || "")
      .trim()
      .toLowerCase();

    const clash = await User.findOne({
      email: emailNorm,
    });

    if (clash) {
      return sendError(
        res,
        400,
        "Email is already in use"
      );
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
    }

    if (
      role !== "employee" &&
      managerId
    ) {
      return sendError(
        res,
        400,
        "managerId is only allowed for employees"
      );
    }

    const payload = {
      username:

        String(username || "").trim(),

      email: emailNorm,

      password,

      role,

      isActive: true,
    };

    if (role === "employee") {
      payload.managerId =
        managerId;
    }

    const user = await User.create(
      payload
    );

    await saveAuditLog(
      "user.created",
      req.user.id,

      req.user.role,

      {
        newUserId: user._id,

        email:

          user.email,

        role: user.role,
      },

      req.ip
    );

    const fresh = await User.findById(user._id)
      .select(
        "-password -refreshToken"
      );

    return sendSuccess(res, 201, "User created", {
      user: fresh,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = createUserController;
