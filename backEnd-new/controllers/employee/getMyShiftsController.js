// getMyShiftsController.js
// Route: GET /api/employee/shifts/myshifts
// Who: employee only
// Lists shifts where logged-in worker is assigned.

const Shift = require("../../models/Shift");

const { sendSuccess } =
  require("../../helpers/sendResponse");

// Returns shifts including this employee ID.
async function getMyShiftsController(
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

    const employeeId = req.user.id;

    const filter = {
      acceptedEmployees: employeeId,
    };

    const totalShifts =
      await Shift.countDocuments(filter);

    const shifts = await Shift.find(filter)
      .populate(
        "createdByManager",
        "username email"
      )
      .sort({ shiftStartTime: -1 })
      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 200, "Your shifts loaded", {
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

module.exports = getMyShiftsController;
