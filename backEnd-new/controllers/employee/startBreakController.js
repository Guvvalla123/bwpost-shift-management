// startBreakController.js
// Records when an employee starts a break.
// Changes attendance status to on_break.
//
// Route: POST /api/attendance/break/start
//
// Who can access: any logged in user
//
// Request body needed:
// shiftId - the shift they are on break from
// type - type of break: short_break or lunch

const Attendance = require("../../models/Attendance");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

async function startBreakController(req, res, next) {
  try {
    const { shiftId, type } = req.body;

    const breakType = type || "short_break";

    const employeeId = req.user.id;

    const attendance = await Attendance.findOne({
      shift: shiftId,
      employee: employeeId,
    });

    if (!attendance) {
      return sendError(
        res,
        404,
        "You have not checked in to this shift"
      );
    }

    if (attendance.status !== "checked_in") {
      return sendError(
        res,
        400,
        "You must be checked in to start a break"
      );
    }

    attendance.breaks.push({
      start: new Date(),
      type: breakType,
    });

    attendance.status = "on_break";

    await attendance.save();

    await saveAuditLog(
      "attendance.break.start",
      employeeId,
      req.user.role,
      { shiftId, breakType },
      req.ip
    );

    return sendSuccess(res, 200,
      "Break started",
      { attendance }
    );
  } catch (error) {
    next(error);
  }
}

module.exports = startBreakController;
