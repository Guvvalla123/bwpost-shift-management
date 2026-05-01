// shiftRoutes.js
// These routes handle shift management.
// Only managers and admins can access these.
//
// BASE URL: /api/manager/shifts
// All routes start with /api/manager/shifts
//
// ALL ROUTES REQUIRE:
// 1. isLoggedIn - user must be logged in
// 2. checkRole("manager", "admin") - correct role
//
// AVAILABLE ROUTES:
// GET    /api/manager/shifts
//   - Get list of all shifts with filters
// POST   /api/manager/shifts
//   - Create a new shift
// GET    /api/manager/shifts/dashboard/data
//   - Get dashboard statistics
// GET    /api/manager/shifts/:shiftId
//   - Get one specific shift
// PUT    /api/manager/shifts/:shiftId
//   - Update an existing shift
// DELETE /api/manager/shifts/:shiftId
//   - Delete a shift
//
// IMPORTANT: dashboard/data route must be
// registered BEFORE /:shiftId route
// Otherwise Express thinks "dashboard"
// is a shiftId parameter

const express = require("express");
const router = express.Router();
const { check } = require("express-validator");

// isLoggedIn checks JWT cookie and fills req.user
const isLoggedIn = require("../middleware/isLoggedIn");

// checkRole enforces manager or admin access
const checkRole = require("../middleware/checkRole");

// validate attaches express-validator results to response
const validate = require("../middleware/validate");

// --- shift controllers ---

const getAllShiftsController = require("../controllers/manager/getAllShiftsController");

const getShiftByIdController = require("../controllers/manager/getShiftByIdController");

const createShiftController = require("../controllers/manager/createShiftController");

const updateShiftController = require("../controllers/manager/updateShiftController");

const deleteShiftController = require("../controllers/manager/deleteShiftController");

const getDashboardDataController = require("../controllers/manager/getDashboardDataController");

// GET /api/manager/shifts — list shifts with pagination + filters
router.get("/", isLoggedIn, checkRole("manager", "admin"), getAllShiftsController);

// POST /api/manager/shifts — create shift + optional notifications
router.post(
  "/",
  isLoggedIn,
  checkRole("manager", "admin"),

  [
    // Shift title required
    check("shiftTitle")
      .notEmpty()
      .withMessage("Shift title is required"),

    // Start ISO date required
    check("shiftStartTime")
      .notEmpty()
      .withMessage("Start time is required")
      .isISO8601()
      .withMessage("Start time must be a valid date"),

    check("shiftEndTime")
      .notEmpty()
      .withMessage("End time is required")
      .isISO8601()
      .withMessage("End time must be a valid date"),

    check("slotsAvailable")
      .notEmpty()
      .withMessage("Slots available is required")
      .isInt({ min: 1 })
      .withMessage("Slots must be at least 1"),

    validate,
  ],

  createShiftController
);

// GET /api/manager/shifts/dashboard/data — KPI counts (before /:shiftId!)
router.get(
  "/dashboard/data",
  isLoggedIn,
  checkRole("manager", "admin"),

  getDashboardDataController
);

// GET /api/manager/shifts/:shiftId — fetch single shift detail
router.get(
  "/:shiftId",

  isLoggedIn,

  checkRole("manager", "admin"),

  getShiftByIdController
);

// PUT /api/manager/shifts/:shiftId — partially update permitted fields
router.put(
  "/:shiftId",
  isLoggedIn,
  checkRole("manager", "admin"),

  [
    check("shiftTitle")
      .optional()
      .notEmpty()
      .withMessage("Shift title cannot be empty"),

    check("shiftStartTime")
      .optional()
      .isISO8601()
      .withMessage("Start time must be a valid date"),

    check("shiftEndTime")
      .optional()
      .isISO8601()
      .withMessage("End time must be a valid date"),

    check("slotsAvailable")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Slots must be at least 1"),

    validate,
  ],

  updateShiftController
);

// DELETE /api/manager/shifts/:shiftId — hard delete shift document
router.delete(
  "/:shiftId",

  isLoggedIn,

  checkRole("manager", "admin"),

  deleteShiftController
);

module.exports = router;
