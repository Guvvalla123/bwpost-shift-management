// employeeRoutes.js
// BASE URL: /api/employee/shifts
//
// Every endpoint requires:
//   isLoggedIn + checkRole("employee")

const express = require("express");

const router = express.Router();

const { check } = require("express-validator");

const isLoggedIn =
  require("../middleware/isLoggedIn");

const checkRole =
  require("../middleware/checkRole");

const validate =
  require("../middleware/validate");

const getAvailableShiftsController =
  require("../controllers/employee/getAvailableShiftsController");

const getMyShiftsController =
  require("../controllers/employee/getMyShiftsController");

const applyForShiftController =
  require("../controllers/employee/applyForShiftController");

const cancelShiftController =
  require("../controllers/employee/cancelShiftController");

const submitLeaveRequestController =
  require("../controllers/employee/submitLeaveRequestController");

const submitShiftChangeRequestController =
  require("../controllers/employee/submitShiftChangeRequestController");

const getMyRequestsController =
  require("../controllers/employee/getMyRequestsController");

const guard = [isLoggedIn, checkRole("employee")];

// Browse upcoming shifts with empty seats
router.get(
  "/available-shifts",
  guard,
  getAvailableShiftsController
);

// Accepted roster for this employee
router.get(
  "/myshifts",

  guard,

  getMyShiftsController
);

router.post(
  "/applyForShift",

  guard,

  [
    check("shiftId")
      .notEmpty()
      .withMessage("Shift ID is required"),
    validate,
  ],

  applyForShiftController
);

router.post(
  "/cancelShift",

  guard,

  [
    check("shiftId")
      .notEmpty()
      .withMessage("Shift ID is required"),
    validate,
  ],

  cancelShiftController
);

router.post(
  "/requests/leave",

  guard,

  [
    check("shiftId")
      .notEmpty()
      .withMessage("Shift ID is required"),

    check("reason")
      .optional()
      .isString(),

    validate,
  ],

  submitLeaveRequestController
);

router.post(
  "/requests/shift-change",

  guard,

  [
    check("currentShiftId")
      .notEmpty()
      .withMessage("Current shift ID is required"),

    check("requestedShiftId")
      .notEmpty()
      .withMessage(
        "Requested shift ID is required"
      ),

    check("reason")
      .optional()
      .isString(),

    validate,
  ],

  submitShiftChangeRequestController
);

router.get(
  "/requests",

  guard,

  getMyRequestsController
);

module.exports = router;
