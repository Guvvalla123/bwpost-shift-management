// getAllUsersController.js
// Route: GET /api/admin/users
// Who: admin only
// Paged roster with optional text and role filters.
//
// Never sends password hashes to the browser.

const User = require("../../models/User");

const {
  sendSuccess,
} = require("../../helpers/sendResponse");

// Tiny helper so user search strings stay safe regex
function escapeRegex(text) {
  return String(text).replace(
    /[.*+?^${}()|[\]\\]/g,

    "\\$&"
  );
}

// getAllUsersController - returns sanitized user slices
async function getAllUsersController(
  req,
  res,
  next
) {
  try {
    const page =
      parseInt(req.query.page, 10) || 1;

    const limit =
      parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const filter = {};

    // Toggle inactive roster visibility
    const includeInactive =
      req.query.includeInactive === "true";

    if (!includeInactive) {
      filter.isActive = true;
    }

    const roleFilter = req.query.role;

    if (
      ["admin", "manager", "employee"].includes(
        roleFilter
      )
    ) {
      filter.role = roleFilter;
    }

    const search = req.query.search;

    // Optional fuzzy match on identifiers
    if (search && search.trim()) {
      const safe = escapeRegex(search.trim());

      filter.$or = [
        {
          username: new RegExp(safe, "i"),
        },

        {
          email: new RegExp(safe, "i"),
        },
      ];
    }

    const totalUsers =
      await User.countDocuments(filter);

    const users = await User.find(filter)
      .select("-password -refreshToken")
      .sort({ createdAt: -1 })

      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 200, "Users loaded", {
      users,

      pagination: {
        currentPage: page,

        totalPages:
          Math.ceil(totalUsers / limit) || 1,

        totalUsers,

        limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = getAllUsersController;
