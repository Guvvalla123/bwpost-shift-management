// checkOutController.js
// Records when an employee checks out of a shift.
// Updates the attendance record with check out time
// and calculates total minutes worked.
//
// Route: POST /api/attendance/checkout
//
// Who can access: any logged in user
//
// Request body needed:
// shiftId - the ID of the shift to check out from
// notes - optional notes about the shift

// Attendance document updates
const Attendance = require("../../models/Attendance");

const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

const saveAuditLog =
  require("../../helpers/saveAuditLog");

async function checkOutController(req, res, next) {
  try {
    const { shiftId, notes } = req.body;

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

    // Employee must wrap up breaks before checkout in this API
    if (attendance.status !== "checked_in") {
      return sendError(
        res,
        400,
        "You are not currently checked in"
      );
    }

    const checkOutTime = new Date();

    const checkInTime = new Date(attendance.checkIn);

    const totalWorkMinutes = Math.floor(
      (checkOutTime - checkInTime) / (1000 * 60)
    );

    attendance.status = "checked_out";
    attendance.checkOut = checkOutTime;
    attendance.totalWorkMinutes = totalWorkMinutes;

    if (notes) {
      attendance.notes = notes;
    }

    await attendance.save();

    await saveAuditLog(
      "attendance.checkout",
      employeeId,
      req.user.role,
      { shiftId, totalWorkMinutes },
      req.ip
    );

    return sendSuccess(res, 200,
      "Checked out successfully",
      { attendance }
    );
  } catch (error) {
    next(error);
  }
}

module.exports = checkOutController;
