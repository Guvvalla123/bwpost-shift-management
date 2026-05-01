// getDashboardDataController.js
// Gets statistics for the manager dashboard.
// Returns counts of shifts by status.
//
// Route: GET /api/manager/shifts/dashboard/data
//
// Who can access: admin and manager only
//
// Returns:
// totalShifts - total number of shifts
// ongoingShifts - shifts happening right now
// upcomingShifts - shifts not started yet
// completedShifts - shifts that have ended
// totalEmployees - total employees in team

const Shift = require("../../models/Shift");

const User = require("../../models/User");

const { sendSuccess } = require("../../helpers/sendResponse");

/**
 * Aggregates simple KPI metrics for dashboards.
 */
async function getDashboardDataController(req, res, next) {
  try {
    // Get current time for comparisons across queries
    const now = new Date();

    // Build manager visibility filter ("my shifts" vs "all shifts")
    const managerFilter = {};

    // Managers scope to their authored shifts only
    if (req.user.role === "manager") {
      managerFilter.createdByManager = req.user.id;
    }

    // Count total shifts for this scope
    const totalShifts = await Shift.countDocuments(managerFilter);

    // Active window: overlap with "now"
    const ongoingShifts = await Shift.countDocuments({
      ...managerFilter,

      shiftStartTime: { $lte: now },

      shiftEndTime: { $gte: now },
    });

    // Future workload
    const upcomingShifts = await Shift.countDocuments({
      ...managerFilter,

      shiftStartTime: { $gt: now },
    });

    // Past workload
    const completedShifts = await Shift.countDocuments({
      ...managerFilter,

      shiftEndTime: { $lt: now },
    });

    // Headcount answering to whoever is viewing dashboard
    const totalEmployees = await User.countDocuments({
      role: "employee",

      managerId: req.user.id,

      isActive: true,
    });

    // Return KPI bundle to client
    return sendSuccess(res, 200, "Dashboard data loaded", {
      totalShifts,

      ongoingShifts,

      upcomingShifts,

      completedShifts,

      totalEmployees,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = getDashboardDataController;
