// getAvailableShiftsController.js
// Route: GET /api/employee/shifts/available-shifts
// Who: employee only
// Paginated shifts the employee may apply for.
//
// Filters:
//   slotsAvailable greater than zero
//   employee not yet in acceptedEmployees
//   shift starts in the future
//   optionally only shifts authored by employee.managerId

const Shift = require("../../models/Shift");

const User = require("../../models/User");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

// Loads open future shifts excluding ones already assigned to caller.
async function getAvailableShiftsController(
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

    const now = new Date();

    const me = await User.findById(
      req.user.id
    ).select("managerId");

    if (!me) {
      return sendError(res, 404, "User not found");
    }

    // Narrow to shifts from the supervisor when possible
    const filter = {
      slotsAvailable: { $gt: 0 },

      shiftStartTime: { $gt: now },

      acceptedEmployees: {
        $nin: [req.user.id],
      },
    };

    if (me.managerId) {
      filter.createdByManager = me.managerId;
    }

    const totalShifts =
      await Shift.countDocuments(filter);

    const shifts = await Shift.find(filter)
      .populate(
        "createdByManager",
        "username email"
      )
      .sort({ shiftStartTime: 1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 200, "Available shifts loaded", {
      shifts,

      pagination: {
        currentPage: page,

        totalPages:
          Math.ceil(totalShifts / limit) || 1,

        totalShifts,

        limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = getAvailableShiftsController;
