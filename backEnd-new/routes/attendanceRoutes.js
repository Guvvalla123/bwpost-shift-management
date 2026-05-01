// attendanceRoutes.js
// These routes handle attendance tracking.
// Employees check in and out of shifts here.
//
// BASE URL: /api/attendance
//
// ALL ROUTES REQUIRE isLoggedIn
//
// EMPLOYEE ROUTES:
// POST /api/attendance/checkin
// POST /api/attendance/checkout
// POST /api/attendance/break/start
// POST /api/attendance/break/end
// GET  /api/attendance/my/:shiftId
// GET  /api/attendance/weekly-hours
//
// MANAGER / ADMIN ROUTE:
// GET  /api/attendance/shift/:shiftId

const express = require("express");

const router = express.Router();

const { check } = require("express-validator");

// Validates JWT cookie
const isLoggedIn =
  require("../middleware/isLoggedIn");

// Locks manager-only aggregates
const checkRole =
  require("../middleware/checkRole");

// express-validator error bridge
const validate =
  require("../middleware/validate");

const checkInController =
  require("../controllers/employee/checkInController");

const checkOutController =
  require("../controllers/employee/checkOutController");

const startBreakController =
  require("../controllers/employee/startBreakController");

const endBreakController =
  require("../controllers/employee/endBreakController");

const getMyAttendanceController =
  require("../controllers/employee/getMyAttendanceController");

const getShiftAttendanceController =
  require("../controllers/manager/getShiftAttendanceController");

const getWeeklyHoursController =
  require("../controllers/employee/getWeeklyHoursController");

// POST check-in opens attendance row when assigned
router.post(
  "/checkin",
  isLoggedIn,
  [
    check("shiftId")
      .notEmpty()
      .withMessage("Shift ID is required"),
    validate,
  ],
  checkInController
);

// POST check-out finalizes totals
router.post(
  "/checkout",
  isLoggedIn,
  [
    check("shiftId")
      .notEmpty()
      .withMessage("Shift ID is required"),
    validate,
  ],
  checkOutController
);

// POST start break pushes segment + flips status
router.post(
  "/break/start",
  isLoggedIn,
  [
    check("shiftId")
      .notEmpty()
      .withMessage("Shift ID is required"),
    check("type")
      .optional()
      .isIn(["short_break", "lunch"])
      .withMessage(
        "Break type must be short_break or lunch"
      ),
    validate,
  ],
  startBreakController
);

// POST end break seals last segment
router.post(
  "/break/end",
  isLoggedIn,
  [
    check("shiftId")
      .notEmpty()
      .withMessage("Shift ID is required"),
    validate,
  ],
  endBreakController
);

// GET weekly totals — BEFORE param routes containing :shiftId
router.get(
  "/weekly-hours",
  isLoggedIn,
  getWeeklyHoursController
);

// GET attendance + shift for logged-in worker
router.get(
  "/my/:shiftId",
  isLoggedIn,
  getMyAttendanceController
);

// GET roster for managers/admins reviewing a shift
router.get(
  "/shift/:shiftId",
  isLoggedIn,
  checkRole("manager", "admin"),
  getShiftAttendanceController
);

module.exports = router;
