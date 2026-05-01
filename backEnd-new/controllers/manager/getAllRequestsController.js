// getAllRequestsController.js
// Route: GET /api/manager/requests
// Who: manager and admin
// Lists requests filtered to manager-authored shifts.

const Shift = require("../../models/Shift");

const ShiftRequest = require("../../models/ShiftRequest");

const { sendSuccess } =
  require("../../helpers/sendResponse");

// Applies status filter + paging for inbox screen.
async function getAllRequestsController(
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

    const rawStatus =
      req.query.status || "all";

    const filter = {};

    if (
      rawStatus !== "all" &&
      ["pending", "approved", "rejected"].includes(
        rawStatus
      )
    ) {
      filter.status = rawStatus;
    }

    if (req.user.role === "manager") {
      const myShifts = await Shift.find({
        createdByManager: req.user.id,
      }).select("_id");

      const ids = myShifts.map(function (s) {
        return s._id;
      });

      filter.currentShift = { $in: ids };
    }

    const totalRequests =
      await ShiftRequest.countDocuments(
        filter
      );

    const requests =
      await ShiftRequest.find(filter)
        .populate("employee", "username email")
        .populate(
          "currentShift",
          "shiftTitle shiftStartTime shiftEndTime createdByManager"
        )
        .populate(
          "requestedShift",
          "shiftTitle shiftStartTime shiftEndTime createdByManager"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return sendSuccess(res, 200, "Requests loaded", {
      requests,

      pagination: {
        currentPage: page,

        totalPages:
          Math.ceil(totalRequests / limit) || 1,

        totalRequests,

        limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports =
  getAllRequestsController;
