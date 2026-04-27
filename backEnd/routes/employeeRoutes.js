// employeeRoutes.js
// These routes are for employee actions.
// Only employees can access these routes.
//
// BASE URL: /api/employee/shifts
//
// ALL ROUTES REQUIRE:
// isLoggedIn and checkRole("employee")
//
// AVAILABLE ROUTES:
// GET  /api/employee/shifts/available-shifts              - browse open shifts
// GET  /api/employee/shifts/myshifts                     - view my assigned shifts
// POST /api/employee/shifts/applyForShift                - apply for a shift
// POST /api/employee/shifts/cancelShift                  - cancel a shift application
// POST /api/employee/shifts/requests/leave               - submit leave request
// POST /api/employee/shifts/requests/shift-change        - submit shift change request
// GET  /api/employee/shifts/requests                     - view my requests

const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/checkRole");
const validateInput = require("../middleware/validateInput");

const {
  applyForShiftSchema,
  cancelShiftSchema,
  leaveRequestSchema,
  shiftChangeRequestSchema,
} = require("../validation/employeeValidation");

// Shift actions come from employeeController
const {
  getAvailableShifts,
  getMyShifts,
  applyForShift,
  cancelShiftApplication,
} = require("../controllers/employeeController");

// Request actions come from requestController
const {
  createLeaveRequest,
  createShiftChangeRequest,
  getMyRequests,
} = require("../controllers/requestController");

// GET /api/employee/shifts/available-shifts
// Returns all upcoming shifts that still have open slots
// Employee browses this list to find shifts they can apply for
router.get("/available-shifts", isLoggedIn, checkRole("employee"), getAvailableShifts);

// GET /api/employee/shifts/myshifts
// Returns all shifts the employee has been accepted into
// Employee uses this to see their upcoming work schedule
router.get("/myshifts", isLoggedIn, checkRole("employee"), getMyShifts);

// POST /api/employee/shifts/applyForShift
// Employee applies to join an open shift
// Adds them to the acceptedEmployees list and decreases slotsAvailable
router.post("/applyForShift", isLoggedIn, checkRole("employee"), validateInput(applyForShiftSchema), applyForShift);

// POST /api/employee/shifts/cancelShift
// Employee cancels their application for a shift they applied to
// Removes them from acceptedEmployees and frees up the slot
router.post("/cancelShift", isLoggedIn, checkRole("employee"), validateInput(cancelShiftSchema), cancelShiftApplication);

// POST /api/employee/shifts/requests/leave
// Employee submits a leave request for a shift they cannot attend
// Manager will see this in the requests list and approve or reject it
router.post("/requests/leave", isLoggedIn, checkRole("employee"), validateInput(leaveRequestSchema), createLeaveRequest);

// POST /api/employee/shifts/requests/shift-change
// Employee requests to swap or change their shift
// Manager reviews and approves or rejects the change
router.post("/requests/shift-change", isLoggedIn, checkRole("employee"), validateInput(shiftChangeRequestSchema), createShiftChangeRequest);

// GET /api/employee/shifts/requests
// Employee views all requests they have submitted
// Shows status: pending, approved, or rejected
router.get("/requests", isLoggedIn, checkRole("employee"), getMyRequests);

module.exports = router;
