// checkInController.js
// Records when an employee checks in to a shift.
// Creates a new attendance record in database.
//
// Route: POST /api/attendance/checkin
//
// Who can access: any logged in user
//
// Request body needed:
// shiftId - the ID of the shift to check in to
//
// What this does step by step:
// 1. Gets shiftId from request body
// 2. Finds the shift in database
// 3. Checks employee is assigned to this shift
// 4. Checks if already checked in
// 5. Creates attendance record
// 6. Records check in time
// 7. Checks if employee is late
// 8. Saves audit log
// 9. Returns the attendance record

// Shift model to verify the shift exists
const Shift = require("../../models/Shift");

// Attendance model to create the record
const Attendance = require("../../models/Attendance");

// sendSuccess and sendError for responses
const { sendSuccess, sendError } =
  require("../../helpers/sendResponse");

// saveAuditLog to record check in action
const saveAuditLog =
  require("../../helpers/saveAuditLog");

// Handles POST /api/attendance/checkin
async function checkInController(req, res, next) {
  try {
    // Get shift ID from request body
    const { shiftId } = req.body;

    // Get the employee ID from the token
    // isLoggedIn middleware sets req.user
    const employeeId = req.user.id;

    // Find the shift in database
    const shift = await Shift.findById(shiftId);

    // If shift not found
    if (!shift) {
      return sendError(res, 404, "Shift not found");
    }

    // Check if employee is assigned to this shift
    const isAssigned = shift.acceptedEmployees.some(
      function (assignedId) {
        return assignedId.toString() === employeeId.toString();
      }
    );

    // If employee is not in this shift
    if (!isAssigned) {
      return sendError(
        res,
        403,
        "You are not assigned to this shift"
      );
    }

    // One row per employee+shift — see unique index on model
    const existingRecord = await Attendance.findOne({
      shift: shiftId,
      employee: employeeId,
    });

    // Already finished this shift → cannot check in again
    if (
      existingRecord &&
      existingRecord.status === "checked_out"
    ) {
      return sendError(
        res,
        400,
        "You have already completed this shift"
      );
    }

    // Still actively on this shift (working or break)
    if (
      existingRecord &&
      (existingRecord.status === "checked_in" ||
        existingRecord.status === "on_break")
    ) {
      return sendError(
        res,
        400,
        "You are already checked in to this shift"
      );
    }

    // Get the current time for check in
    const checkInTime = new Date();

    // Compare against scheduled start for lateness (> 10 minutes)
    const shiftStartTime = new Date(shift.shiftStartTime);

    const minutesDifference =
      (checkInTime - shiftStartTime) / (1000 * 60);

    const isLate = minutesDifference > 10;

    // Persist first attendance snapshot for this pair
    const attendance = await Attendance.create({
      shift: shiftId,
      employee: employeeId,
      status: "checked_in",
      checkIn: checkInTime,
      isLate: isLate,
    });

    await saveAuditLog(
      "attendance.checkin",
      employeeId,
      req.user.role,
      { shiftId, isLate, checkInTime },
      req.ip
    );

    return sendSuccess(res, 201,
      isLate
        ? "Checked in successfully (marked as late)"
        : "Checked in successfully",
      { attendance }
    );
  } catch (error) {
    next(error);
  }
}

module.exports = checkInController;
