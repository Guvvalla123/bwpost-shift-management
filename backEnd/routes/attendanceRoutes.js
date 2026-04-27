// attendanceRoutes.js
// These routes handle attendance tracking.
// Check in, check out, and breaks.
//
// BASE URL: /api/attendance
//
// EMPLOYEE ROUTES (any logged in user):
// POST /api/attendance/checkin               - employee checks in to shift
// POST /api/attendance/checkout              - employee checks out of shift
// POST /api/attendance/break/start           - employee starts a break
// POST /api/attendance/break/end             - employee ends a break
// GET  /api/attendance/my/:shiftId           - employee views own attendance
// GET  /api/attendance/weekly-hours          - employee views weekly hours
//
// MANAGER ROUTES:
// GET  /api/attendance/shift/:shiftId        - manager views all attendance for a shift

const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/checkRole");
const validateInput = require("../middleware/validateInput");

const {
  checkInSchema,
  checkOutSchema,
  startBreakSchema,
  endBreakSchema,
} = require("../validation/attendanceValidation");

// All attendance functions are in attendanceController
const ctrl = require("../controllers/attendanceController");

// POST /api/attendance/checkin
// Employee checks in at the start of their shift
// Records the check-in time and calculates if they are late
router.post("/checkin", isLoggedIn, validateInput(checkInSchema), ctrl.checkIn);

// POST /api/attendance/checkout
// Employee checks out at the end of their shift
// Records check-out time and calculates total hours worked
router.post("/checkout", isLoggedIn, validateInput(checkOutSchema), ctrl.checkOut);

// POST /api/attendance/break/start
// Employee marks the start of a break during their shift
// Break time is tracked separately and deducted from total hours
router.post("/break/start", isLoggedIn, validateInput(startBreakSchema), ctrl.startBreak);

// POST /api/attendance/break/end
// Employee marks the end of their break
// Resumes tracking of work time
router.post("/break/end", isLoggedIn, validateInput(endBreakSchema), ctrl.endBreak);

// GET /api/attendance/weekly-hours
// Returns the total hours worked by the employee in the current week
// Employee can see if they are approaching the 40 hour limit
router.get("/weekly-hours", isLoggedIn, checkRole("employee"), ctrl.getWeeklyHours);

// GET /api/attendance/my/:shiftId
// Employee views their own attendance record for a specific shift
// Shows check-in time, check-out time, break duration and total hours
router.get("/my/:shiftId", isLoggedIn, ctrl.getMyAttendance);

// GET /api/attendance/shift/:shiftId
// Manager views all attendance records for a specific shift
// Shows every employee's check-in, check-out and hours for that shift
router.get("/shift/:shiftId", isLoggedIn, checkRole("admin", "manager"), ctrl.getShiftAttendance);

module.exports = router;
