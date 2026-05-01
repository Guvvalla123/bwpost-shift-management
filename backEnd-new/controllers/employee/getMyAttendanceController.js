// getMyAttendanceController.js
// Gets the attendance record for one employee
// for one specific shift.
//
// Route: GET /api/attendance/my/:shiftId
//
// Who can access: any logged in user
//
// URL params:
// shiftId - the shift to get attendance for

const Attendance = require("../../models/Attendance");

const Shift = require("../../models/Shift");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

async function getMyAttendanceController(req, res, next) {
  try {
    const shiftId = req.params.shiftId;

    const employeeId = req.user.id;

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    const attendance = await Attendance.findOne({
      shift: shiftId,
      employee: employeeId,
    });

    return sendSuccess(res, 200,
      "Attendance loaded",
      {
        shift,
        attendance: attendance || null,
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports = getMyAttendanceController;
