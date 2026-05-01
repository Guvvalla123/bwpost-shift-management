// getMyRequestsController.js
// Route: GET /api/employee/shifts/requests
// Who: employee only
// Timeline of every request logged-in employee filed.

const ShiftRequest = require("../../models/ShiftRequest");

const { sendSuccess } =
  require("../../helpers/sendResponse");

// Applies pagination plus shift population stubs.
async function getMyRequestsController(
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
      employee: employeeId,
    };

    const total =
      await ShiftRequest.countDocuments(
        filter
      );

    const requests =
      await ShiftRequest.find(filter)
        .populate("currentShift", [
          "shiftTitle",
          "shiftStartTime",
          "shiftEndTime",
        ])
        .populate("requestedShift", [
          "shiftTitle",
          "shiftStartTime",
          "shiftEndTime",
        ])
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return sendSuccess(res, 200, "Your requests loaded", {
      requests,

      pagination: {
        currentPage: page,

        totalPages: Math.ceil(total / limit) || 1,

        totalRequests: total,

        limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports =
  getMyRequestsController;
