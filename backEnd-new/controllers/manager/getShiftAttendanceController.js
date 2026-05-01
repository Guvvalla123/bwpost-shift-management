// getShiftAttendanceController.js
// Gets all attendance records for one shift.
// Manager uses this to see who checked in.
//
// Route: GET /api/attendance/shift/:shiftId
//
// Who can access: admin and manager only
//
// URL params:
// shiftId - the shift to get attendance for

const Attendance = require("../../models/Attendance");

const Shift = require("../../models/Shift");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

async function getShiftAttendanceController(req, res, next) {
  try {
    const shiftId = req.params.shiftId;

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    // Managers scoped to shifts they authored
    if (req.user.role === "manager") {
      if (
        shift.createdByManager.toString() !==
        req.user.id.toString()
      ) {
        return sendError(
          res,
          403,
          "You can only view attendance for your shifts"
        );
      }
    }

    const attendanceList = await Attendance.find({
      shift: shiftId,
    })
      .populate("employee", "username email profileImage")
      .sort({ checkIn: 1 });

    return sendSuccess(res, 200,
      "Attendance records loaded",
      {
        shift,
        attendanceList,
        totalRecords: attendanceList.length,
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports = getShiftAttendanceController;
