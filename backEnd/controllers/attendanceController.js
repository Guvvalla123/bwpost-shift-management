// attendanceController.js
// This file handles all attendance tracking.
// Employees check in and out using these functions.
//
// ROUTES THAT USE THIS CONTROLLER:
// POST /api/attendance/checkin
// POST /api/attendance/checkout
// POST /api/attendance/break/start
// POST /api/attendance/break/end
// GET  /api/attendance/my/:shiftId
// GET  /api/attendance/shift/:shiftId
// GET  /api/attendance/weekly-hours

const Shift = require("../models/Shift");
const Attendance = require("../models/Attendance");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/sendResponse");
const { log } = require("../helpers/auditLogger");
const { getWeeklyMinutes } = require("../helpers/calculateHours");

// Maximum weekly hours allowed before an employee is considered over limit
const WEEKLY_LIMIT_HOURS = 40;

// ─── PRIVATE HELPER FUNCTIONS ─────────────────────────────────────────────────

// recalc - recalculates total work time, break time, and overtime for a record
// Called after every check-in, check-out, break start, and break end
// att       - the attendance record to update
// shiftStart - the scheduled start time of the shift
// shiftEnd   - the scheduled end time of the shift
const recalc = (att, shiftStart, shiftEnd) => {
  const now = new Date();

  // Add up all completed work sessions
  let workMins = att.workSessions.reduce((sum, ws) => {
    if (!ws.checkOut) return sum;
    return sum + (ws.checkOut - ws.checkIn) / 60000;
  }, 0);

  // If there is an open (in-progress) work session, add its time so far
  const openWork = att.workSessions.find((ws) => !ws.checkOut);
  if (openWork) workMins += (now - openWork.checkIn) / 60000;

  // Add up all completed break sessions
  let breakMins = att.breaks.reduce((sum, b) => {
    if (!b.end) return sum;
    return sum + (b.end - b.start) / 60000;
  }, 0);

  // If there is an open break, add its time so far
  const openBreak = att.breaks.find((b) => !b.end);
  if (openBreak) breakMins += (now - openBreak.start) / 60000;

  // Calculate how many minutes the shift was supposed to last
  const scheduledMins = shiftEnd
    ? Math.max(0, (new Date(shiftEnd) - new Date(shiftStart)) / 60000)
    : 0;

  // Net work is work minus breaks
  const netWorkMins = Math.max(0, workMins - breakMins);

  // Overtime is anything worked beyond the scheduled duration
  const overtimeMins = Math.max(0, netWorkMins - scheduledMins);

  // Store rounded values on the attendance record
  att.totalWorkMinutes = Math.round(netWorkMins);
  att.totalBreakMinutes = Math.round(breakMins);
  att.overtimeMinutes = Math.round(overtimeMins);
  att.totalHours = +(netWorkMins / 60).toFixed(2);
};

// getOrCreateAttendance - finds or creates an attendance record for this employee and shift
// Used by checkIn to avoid creating duplicates
const getOrCreateAttendance = async (shiftId, employeeId) => {
  let record = await Attendance.findOne({ shift: shiftId, employee: employeeId });
  if (!record) {
    // Create a new empty record if one does not exist yet
    record = new Attendance({
      shift: shiftId,
      employee: employeeId,
      status: "not_started",
      workSessions: [],
      breaks: [],
    });
  }
  return record;
};

// ─── ROUTE HANDLER FUNCTIONS ──────────────────────────────────────────────────

// checkIn - employee checks in to a shift
// Records the check-in time and marks them as late if they are more than 10 mins late
exports.checkIn = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId, employeeId } = req.body;

  // Only managers and admins can check in on behalf of another employee
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role !== "manager" &&
    user.role !== "admin"
  ) {
    throw new AppError("Only managers or admins can check in other employees", 403);
  }

  // If no employeeId is given, use the logged in user's ID
  const targetId = employeeId || user.id;

  // Find the shift to verify it exists
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);

  // Managers can only check in employees for their own shifts
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role === "manager" &&
    shift.createdByManager?.toString() !== user.id
  ) {
    throw new AppError("Access denied", 403);
  }

  // Verify the employee is actually assigned to this shift
  if (!shift.acceptedEmployees.some((id) => id.toString() === targetId.toString())) {
    throw new AppError("Employee is not assigned to this shift", 403);
  }

  // Get or create the attendance record for this employee and shift
  const att = await getOrCreateAttendance(shiftId, targetId);

  // Cannot check in again if already checked out
  if (att.status === "checked_out") throw new AppError("Shift already completed", 400);

  // Cannot check in again if already checked in
  if (att.status === "checked_in") {
    throw new AppError("Already checked in — check out first or take a break", 400);
  }

  const now = new Date();
  const shiftStart = new Date(shift.shiftStartTime);

  // Calculate how many minutes late the employee is
  const minsLate = Math.floor((now - shiftStart) / 60000);

  // Mark as late if more than 10 minutes after shift start (and this is first check-in)
  if (att.workSessions.length === 0 && minsLate > 10) {
    att.isLate = true;
    att.lateByMins = minsLate;
  }

  // Record this check-in as a new work session
  att.workSessions.push({ checkIn: now });
  att.status = "checked_in";

  // Only set the overall checkIn time on the first check-in
  att.checkIn = att.checkIn || now;

  // Recalculate totals
  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  await att.save();

  // Log the check-in event
  log("attendance.checkin", req, "Shift", shiftId, {
    employeeId: targetId,
    shiftId,
    time: new Date(),
  });

  const { message, data } = { message: "Checked in successfully", data: att };
  return sendSuccess(res, 200, { message, data });
});

// checkOut - employee checks out of a shift
// Records the check-out time and calculates total hours worked
exports.checkOut = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId, employeeId, notes } = req.body;

  // Only managers and admins can check out on behalf of another employee
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role !== "manager" &&
    user.role !== "admin"
  ) {
    throw new AppError("Only managers or admins can check out other employees", 403);
  }

  const targetId = employeeId || user.id;

  // Find the shift
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);

  // Managers can only check out employees on their own shifts
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role === "manager" &&
    shift.createdByManager?.toString() !== user.id
  ) {
    throw new AppError("Access denied", 403);
  }

  // Find the attendance record
  const att = await Attendance.findOne({ shift: shiftId, employee: targetId });
  if (!att) throw new AppError("No attendance record found — check in first", 400);
  if (att.status === "checked_out") throw new AppError("Already checked out", 400);
  if (att.status === "on_break") throw new AppError("End break before checking out", 400);
  if (att.status !== "checked_in") throw new AppError("Not currently checked in", 400);

  const now = new Date();

  // Close the open work session
  const openWork = [...att.workSessions].reverse().find((ws) => !ws.checkOut);
  if (openWork) openWork.checkOut = now;

  // Mark as left early if checking out before shift end time
  const shiftEnd = new Date(shift.shiftEndTime);
  if (now < shiftEnd) att.leftEarly = true;

  att.status = "checked_out";
  att.checkOut = now;
  if (notes) att.notes = notes;

  // Recalculate totals after checkout
  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  await att.save();

  log("attendance.checkout", req, "Shift", shiftId, {
    employeeId: targetId,
    shiftId,
    time: new Date(),
  });

  const { message, data } = { message: "Checked out successfully", data: att };
  return sendSuccess(res, 200, { message, data });
});

// startBreak - employee starts a break during their shift
// Closes the current work session and opens a break session
exports.startBreak = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId, type = "short_break", employeeId } = req.body;

  // Only managers and admins can start breaks on behalf of another employee
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role !== "manager" &&
    user.role !== "admin"
  ) {
    throw new AppError("Only managers or admins can start breaks for other employees", 403);
  }

  const targetId = employeeId || user.id;

  // Find the shift
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);

  // Manager access check
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role === "manager" &&
    shift.createdByManager?.toString() !== user.id
  ) {
    throw new AppError("Access denied", 403);
  }

  // Find the attendance record and verify they are checked in
  const att = await Attendance.findOne({ shift: shiftId, employee: targetId });
  if (!att || att.status !== "checked_in") {
    throw new AppError("Must be checked in to start a break", 400);
  }

  // Cannot start a second break while still on a break
  if (att.breaks.some((b) => !b.end)) throw new AppError("Already on a break", 400);

  const now = new Date();

  // Close the current open work session
  const openWork = [...att.workSessions].reverse().find((ws) => !ws.checkOut);
  if (openWork) openWork.checkOut = now;

  // Start the break session
  att.breaks.push({ start: now, type });
  att.status = "on_break";

  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  await att.save();

  log("attendance.break.start", req, "Shift", shiftId, {
    employeeId: targetId,
    shiftId,
    time: new Date(),
  });

  const { message, data } = { message: "Break started", data: att };
  return sendSuccess(res, 200, { message, data });
});

// endBreak - employee ends their break and resumes work
// Closes the break session and opens a new work session
exports.endBreak = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId, employeeId } = req.body;

  // Only managers and admins can end breaks on behalf of another employee
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role !== "manager" &&
    user.role !== "admin"
  ) {
    throw new AppError("Only managers or admins can end breaks for other employees", 403);
  }

  const targetId = employeeId || user.id;

  // Find the shift
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);

  // Manager access check
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role === "manager" &&
    shift.createdByManager?.toString() !== user.id
  ) {
    throw new AppError("Access denied", 403);
  }

  // Find the attendance record and verify they are on break
  const att = await Attendance.findOne({ shift: shiftId, employee: targetId });
  if (!att || att.status !== "on_break") throw new AppError("Not currently on break", 400);

  const now = new Date();

  // Close the open break session
  const openBreak = [...att.breaks].reverse().find((b) => !b.end);
  if (openBreak) openBreak.end = now;

  // Start a new work session now that break is over
  att.workSessions.push({ checkIn: now });
  att.status = "checked_in";

  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  await att.save();

  log("attendance.break.end", req, "Shift", shiftId, {
    employeeId: targetId,
    shiftId,
    time: new Date(),
  });

  const { message, data } = { message: "Break ended — back to work", data: att };
  return sendSuccess(res, 200, { message, data });
});

// getMyAttendance - employee views their own attendance record for one shift
exports.getMyAttendance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { shiftId } = req.params;

  // Find the shift
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);

  // Find their attendance record for this shift
  const att = await Attendance.findOne({ shift: shiftId, employee: userId });

  // If no record yet return empty defaults so frontend does not break
  if (!att) {
    return sendSuccess(res, 200, {
      data: {
        shift: {
          _id: shift._id,
          shiftTitle: shift.shiftTitle,
          shiftStartTime: shift.shiftStartTime,
          shiftEndTime: shift.shiftEndTime,
        },
        attendance: {
          status: "not_started",
          workSessions: [],
          breaks: [],
          totalWorkMinutes: 0,
          totalBreakMinutes: 0,
        },
      },
    });
  }

  // Recalculate totals before returning
  recalc(att, shift.shiftStartTime, shift.shiftEndTime);

  return sendSuccess(res, 200, {
    data: {
      shift: {
        _id: shift._id,
        shiftTitle: shift.shiftTitle,
        shiftStartTime: shift.shiftStartTime,
        shiftEndTime: shift.shiftEndTime,
      },
      attendance: att,
    },
  });
});

// getShiftAttendance - manager views all employee attendance for one shift
// Returns every accepted employee with their attendance status
exports.getShiftAttendance = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId } = req.params;

  // Find the shift with full employee and manager details
  const shift = await Shift.findById(shiftId)
    .populate("acceptedEmployees", "username email profileImage")
    .populate("createdByManager", "username email");

  if (!shift) throw new AppError("Shift not found", 404);

  // Managers can only view attendance for their own shifts
  const managerId =
    shift.createdByManager?._id?.toString() || shift.createdByManager?.toString?.();
  if (user.role === "manager" && managerId !== user.id) {
    throw new AppError("Access denied", 403);
  }

  // Get all attendance records for this shift
  const attendanceDocs = await Attendance.find({ shift: shiftId }).populate(
    "employee",
    "username email profileImage"
  );

  // Build a map for quick lookup by employee ID
  const byEmployeeId = new Map();
  attendanceDocs.forEach((doc) => {
    const eid = doc.employee?._id?.toString() || doc.employee?.toString?.();
    if (eid) byEmployeeId.set(eid, doc);
  });

  // Build the response including employees who have not yet checked in
  const records = shift.acceptedEmployees.map((emp) => {
    const att = byEmployeeId.get(emp._id.toString());
    if (att) {
      recalc(att, shift.shiftStartTime, shift.shiftEndTime);
      const plain = att.toObject ? att.toObject() : att;
      return { ...plain, employee: emp };
    }
    // Return a placeholder for employees who have not started yet
    return {
      employee: emp,
      status: "not_started",
      workSessions: [],
      breaks: [],
      totalWorkMinutes: 0,
      totalBreakMinutes: 0,
      isLate: false,
      lateByMins: 0,
      leftEarly: false,
    };
  });

  const manager = shift.createdByManager;
  const shiftData = {
    _id: shift._id,
    shiftTitle: shift.shiftTitle,
    shiftStartTime: shift.shiftStartTime,
    shiftEndTime: shift.shiftEndTime,
    shiftNotes: shift.shiftNotes || null,
    createdAt: shift.createdAt,
    slotsAvailable: shift.slotsAvailable,
    manager: manager
      ? { _id: manager._id, username: manager.username, email: manager.email }
      : null,
  };

  return sendSuccess(res, 200, { data: { shift: shiftData, attendance: records } });
});

// getWeeklyHours - returns how many minutes this employee has worked this week
// and how many minutes they have left before hitting the 40-hour limit
exports.getWeeklyHours = asyncHandler(async (req, res) => {
  // Get total minutes worked this week for this employee
  const totalMinutes = await getWeeklyMinutes(req.user.id);

  // Calculate the limit and remaining capacity
  const limitMinutes = WEEKLY_LIMIT_HOURS * 60;
  const remainingMinutes = Math.max(0, limitMinutes - totalMinutes);

  return sendSuccess(res, 200, {
    data: {
      totalMinutes,
      limitHours: WEEKLY_LIMIT_HOURS,
      remainingMinutes,
    },
  });
});

// ─── SYSTEM HELPER (exported for use by cron/autoCheckout.js) ─────────────────

// autoCheckoutAttendanceRecord - automatically checks out an employee
// Called by the cron job when a shift has ended and employee is still checked in
// att   - the attendance record to close
// shift - the shift that has ended
const autoCheckoutAttendanceRecord = async (att, shift) => {
  // Skip if already auto checked out (idempotent)
  if (att.autoCheckout) return { skipped: true };

  // Skip if not in checked_in status
  if (att.status !== "checked_in") return { skipped: true };

  const shiftEnd = new Date(shift.shiftEndTime);

  // Close the open work session using the shift end time as check-out time
  const openWork = [...att.workSessions].reverse().find((ws) => !ws.checkOut);
  if (openWork) openWork.checkOut = shiftEnd;

  // Update the attendance record to checked out
  att.status = "checked_out";
  att.checkOut = shiftEnd;
  att.autoCheckout = true;
  att.autoCheckoutAt = new Date();
  att.leftEarly = false;

  // Recalculate hours based on the shift end time
  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  await att.save();

  // Log the auto checkout in the audit trail
  log(
    "attendance.auto_checkout",
    { ip: "cron", get: () => "" },
    "Shift",
    shift._id,
    { employeeId: att.employee, shiftId: shift._id },
    { actorId: att.employee, actorRole: "employee" }
  );

  return { skipped: false };
};

// Export the auto checkout helper for use by the cron job
module.exports.autoCheckoutAttendanceRecord = autoCheckoutAttendanceRecord;
// Export recalc for any other files that might need it
module.exports.recalc = recalc;
