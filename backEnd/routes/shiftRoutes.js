// shiftRoutes.js
// These routes handle shift management and employee management.
// Only managers and admins can access these routes.
//
// BASE URL: /api/manager/shifts
//
// ALL ROUTES REQUIRE:
// 1. isLoggedIn - must be logged in
// 2. checkRole("admin", "manager") - must be admin or manager role
//
// SHIFT ROUTES:
// GET    /api/manager/shifts                        - list all shifts
// POST   /api/manager/shifts                        - create a new shift
// GET    /api/manager/shifts/:shiftId               - get one shift
// PUT    /api/manager/shifts/:shiftId               - update a shift
// DELETE /api/manager/shifts/:shiftId               - delete a shift
// GET    /api/manager/shifts/dashboard/data         - dashboard stats
// GET    /api/manager/shifts/export/csv             - export CSV
//
// EMPLOYEE MANAGEMENT ROUTES:
// POST   /api/manager/shifts/employees              - add an employee
// GET    /api/manager/shifts/employees              - list all employees
// GET    /api/manager/shifts/employees/:employeeId  - get one employee
// PUT    /api/manager/shifts/employees/:employeeId  - update an employee
// DELETE /api/manager/shifts/employees/:employeeId  - remove an employee
// GET    /api/manager/shifts/employees/:employeeId/attendance - attendance history
// POST   /api/manager/shifts/employees/:employeeId/reset-password-link
//
// SHIFT EMPLOYEE ROUTES:
// GET    /api/manager/shifts/shift-accepted-employees/:shiftId
// POST   /api/manager/shifts/shift/assign-employee
// POST   /api/manager/shifts/shift/remove-employee

const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/checkRole");
const validateInput = require("../middleware/validateInput");

const {
  createShiftSchema,
  updateShiftSchema,
  getShiftsQuerySchema,
} = require("../validation/shiftValidation");
const {
  createEmployeeSchema,
  updateEmployeeSchema,
} = require("../validation/employeeValidation");
const {
  assignEmployeeSchema,
  removeEmployeeSchema,
} = require("../validation/attendanceValidation");

// Import shift functions from shiftController
const {
  createShift,
  getAllShiftsManager,
  getShiftById,
  updateShift,
  deleteShift,
  getAllShiftsPublic,
  getShiftAcceptedEmployees,
  assignEmployeeToShift,
  removeEmployeeFromShift,
  exportShiftsCsv,
} = require("../controllers/shiftController");

// Import employee management functions from employeeController
const {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployeeAttendanceHistory,
  generateEmployeeResetLink,
} = require("../controllers/employeeController");

// Import dashboard function from dashboardController
const { getDashboardData } = require("../controllers/dashboardController");

// GET /api/manager/shifts/public
// Returns upcoming open shifts — available to any logged in user
// Used internally when employees browse available shifts
router.get("/public", isLoggedIn, getAllShiftsPublic);

// POST /api/manager/shifts
// Manager creates a new shift
// Validates the shift data before saving
// Sends notifications to eligible employees after creation
router.post("/", isLoggedIn, checkRole("admin", "manager"), validateInput(createShiftSchema), createShift);

// GET /api/manager/shifts
// Manager gets a paginated list of their shifts
// Supports search and status filter via query params
router.get("/", isLoggedIn, checkRole("admin", "manager"), validateInput.validateQuery(getShiftsQuerySchema), getAllShiftsManager);

// GET /api/manager/shifts/dashboard/data
// Returns KPI statistics for the manager dashboard
// Includes shift counts, attendance totals, and employee summaries
router.get("/dashboard/data", isLoggedIn, checkRole("admin", "manager"), getDashboardData);

// GET /api/manager/shifts/export/csv
// Exports the manager's shifts as a downloadable CSV file
// Must be defined before /:shiftId so it is not treated as a shift ID
router.get("/export/csv", isLoggedIn, checkRole("admin", "manager"), exportShiftsCsv);

// POST /api/manager/shifts/employees
// Manager creates a new employee account under their team
// Validates the employee data before saving
router.post("/employees", isLoggedIn, checkRole("admin", "manager"), validateInput(createEmployeeSchema), createEmployee);

// GET /api/manager/shifts/employees
// Returns all employees that belong to this manager
router.get("/employees", isLoggedIn, checkRole("admin", "manager"), getAllEmployees);

// GET /api/manager/shifts/employees/:employeeId
// Returns the full profile of one employee
router.get("/employees/:employeeId", isLoggedIn, checkRole("admin", "manager"), getEmployeeById);

// PUT /api/manager/shifts/employees/:employeeId
// Updates an employee's profile (name, email, etc.)
// Validates the new data before saving
router.put("/employees/:employeeId", isLoggedIn, checkRole("admin", "manager"), validateInput(updateEmployeeSchema), updateEmployee);

// DELETE /api/manager/shifts/employees/:employeeId
// Deactivates an employee account (does not permanently delete)
router.delete("/employees/:employeeId", isLoggedIn, checkRole("admin", "manager"), deleteEmployee);

// GET /api/manager/shifts/employees/:employeeId/attendance
// Returns the attendance history for a specific employee
// Manager uses this to review hours worked
router.get("/employees/:employeeId/attendance", isLoggedIn, checkRole("admin", "manager"), getEmployeeAttendanceHistory);

// POST /api/manager/shifts/employees/:employeeId/reset-password-link
// Generates a password reset link for an employee
// Manager copies the link and sends it to the employee manually
router.post(
  "/employees/:employeeId/reset-password-link",
  isLoggedIn,
  checkRole("admin", "manager"),
  generateEmployeeResetLink
);

// GET /api/manager/shifts/shift-accepted-employees/:shiftId
// Returns the list of employees who have accepted a specific shift
router.get("/shift-accepted-employees/:shiftId", isLoggedIn, checkRole("admin", "manager"), getShiftAcceptedEmployees);

// POST /api/manager/shifts/shift/assign-employee
// Manager manually assigns an employee to a shift
// Bypasses the normal apply process
router.post("/shift/assign-employee", isLoggedIn, checkRole("admin", "manager"), validateInput(assignEmployeeSchema), assignEmployeeToShift);

// POST /api/manager/shifts/shift/remove-employee
// Manager removes an employee from a shift
// Frees up the slot for another employee
router.post("/shift/remove-employee", isLoggedIn, checkRole("admin", "manager"), validateInput(removeEmployeeSchema), removeEmployeeFromShift);

// GET /api/manager/shifts/:shiftId
// Returns the full details of a specific shift
// Dynamic route — must be defined AFTER all static routes above
router.get("/:shiftId", isLoggedIn, checkRole("admin", "manager"), getShiftById);

// PUT /api/manager/shifts/:shiftId
// Updates shift details (title, time, slots, etc.)
// Validates new data before saving
router.put("/:shiftId", isLoggedIn, checkRole("admin", "manager"), validateInput(updateShiftSchema), updateShift);

// DELETE /api/manager/shifts/:shiftId
// Deletes a shift from the database
// Only the manager who created it (or an admin) can delete it
router.delete("/:shiftId", isLoggedIn, checkRole("admin", "manager"), deleteShift);

module.exports = router;
