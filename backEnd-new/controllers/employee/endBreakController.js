// endBreakController.js
// Records when an employee ends their break.
// Changes attendance status back to checked_in.
//
// Route: POST /api/attendance/break/end
//
// Who can access: any logged in user
//
// Request body needed:
// shiftId - the shift they are returning to

const Attendance = require("../../models/Attendance");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

async function endBreakController(req, res, next) {
  try {
    const { shiftId } = req.body;

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

    if (attendance.status !== "on_break") {
      return sendError(
        res,
        400,
        "You are not currently on a break"
      );
    }

    const lastBreak =
      attendance.breaks[attendance.breaks.length - 1];

    if (!lastBreak || lastBreak.end) {
      return sendError(res, 400, "No active break found");
    }

    lastBreak.end = new Date();

    attendance.status = "checked_in";

    await attendance.save();

    await saveAuditLog(
      "attendance.break.end",
      employeeId,
      req.user.role,
      { shiftId },
      req.ip
    );

    return sendSuccess(res, 200,
      "Break ended. Back to work!",
      { attendance }
    );
  } catch (error) {
    next(error);
  }
}

module.exports = endBreakController;
