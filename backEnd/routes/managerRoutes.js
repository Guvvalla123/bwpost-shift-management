const express = require('express');
const { auth, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createShiftSchema,
  updateShiftSchema,
  getShiftsQuerySchema,
} = require('../validators/shiftValidators');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
} = require('../validators/employeeValidators');
const {
  assignEmployeeSchema,
  removeEmployeeSchema,
} = require('../validators/attendanceValidators');
const router = express.Router();

// Manager Controllers
const {
    createShift,
    getAllShiftsManager,
    getShiftById,
    updateShift,
    deleteShift,
    getAllShiftsPublic,
    getAllEmployees,
    getShiftAcceptedEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    removeEmployeeFromShift,
    assignEmployeeToShift,
    getEmployeeAttendanceHistory,
    exportShiftsCsv,
} = require('../controllers/managerController');

// Authenticated (any role): limited upcoming shifts for internal use
router.get("/public", auth, getAllShiftsPublic);

// MANAGER ROUTES - Shifts (admin can also access)
router.post('/', auth, authorize('admin', 'manager'), validate(createShiftSchema), createShift);
router.get('/', auth, authorize('admin', 'manager'), validate.validateQuery(getShiftsQuerySchema), getAllShiftsManager);
router.get('/dashboard/data', auth, authorize('admin', 'manager'), require('../controllers/dashboardController').getDashboardData);

/**
 * GET /api/manager/shifts/export/csv
 * Secure CSV export (must be registered before /:shiftId)
 */
router.get('/export/csv', auth, authorize('admin', 'manager'), exportShiftsCsv);

// MANAGER ROUTES - Employees (admin can also access)
router.post('/employees', auth, authorize('admin', 'manager'), validate(createEmployeeSchema), createEmployee);
router.get('/employees', auth, authorize('admin', 'manager'), getAllEmployees);
router.get('/employees/:employeeId', auth, authorize('admin', 'manager'), getEmployeeById);
router.put('/employees/:employeeId', auth, authorize('admin', 'manager'), validate(updateEmployeeSchema), updateEmployee);
router.delete('/employees/:employeeId', auth, authorize('admin', 'manager'), deleteEmployee);
router.get('/employees/:employeeId/attendance', auth, authorize('admin', 'manager'), getEmployeeAttendanceHistory);

// MANAGER ROUTES - Shift Employees
router.get('/shift-accepted-employees/:shiftId', auth, authorize('admin', 'manager'), getShiftAcceptedEmployees);
router.post('/shift/assign-employee', auth, authorize('admin', 'manager'), validate(assignEmployeeSchema), assignEmployeeToShift);
router.post('/shift/remove-employee', auth, authorize('admin', 'manager'), validate(removeEmployeeSchema), removeEmployeeFromShift);

// Attendance: use /api/attendance only (checkin, checkout, break/*, shift/:shiftId, my/:shiftId)

// Dynamic Routes - Shifts
router.get('/:shiftId', auth, authorize('admin', 'manager'), getShiftById);
router.put('/:shiftId', auth, authorize('admin', 'manager'), validate(updateShiftSchema), updateShift);
router.delete('/:shiftId', auth, authorize('admin', 'manager'), deleteShift);




module.exports = router;
