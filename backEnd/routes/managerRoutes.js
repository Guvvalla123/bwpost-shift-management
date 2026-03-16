const express = require('express');
const { auth, authorize } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  createShiftSchema,
  updateShiftSchema,
} = require('../validators/shiftValidators');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
} = require('../validators/employeeValidators');
const {
  assignEmployeeSchema,
  removeEmployeeSchema,
  managerCheckInSchema,
  managerCheckOutSchema,
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
    getDashboardData,
    markCheckIn,
    markCheckOut,
    getShiftAttendance,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    getEmployeeById,
    removeEmployeeFromShift,
    assignEmployeeToShift,
    getEmployeeAttendanceHistory,
} = require('../controllers/managerController');

// PUBLIC (NO AUTH)
router.get("/public", getAllShiftsPublic);

// MANAGER ROUTES - Shifts
router.post('/', auth, authorize('manager'), validate(createShiftSchema), createShift);
router.get('/', auth, authorize('manager'), getAllShiftsManager);
router.get('/dashboard/data', auth, authorize('manager'), require('../controllers/dashboardController').getDashboardData);

// MANAGER ROUTES - Employees
router.post('/employees', auth, authorize('manager'), validate(createEmployeeSchema), createEmployee);
router.get('/employees', auth, authorize('manager'), getAllEmployees);
router.get('/employees/:employeeId', auth, authorize('manager'), getEmployeeById);
router.put('/employees/:employeeId', auth, authorize('manager'), validate(updateEmployeeSchema), updateEmployee);
router.delete('/employees/:employeeId', auth, authorize('manager'), deleteEmployee);
router.get('/employees/:employeeId/attendance', auth, authorize('manager'), getEmployeeAttendanceHistory);

// MANAGER ROUTES - Shift Employees
router.get('/shift-accepted-employees/:shiftId', auth, authorize('manager'), getShiftAcceptedEmployees);
router.post('/shift/assign-employee', auth, authorize('manager'), validate(assignEmployeeSchema), assignEmployeeToShift);
router.post('/shift/remove-employee', auth, authorize('manager'), validate(removeEmployeeSchema), removeEmployeeFromShift);

// MANAGER ROUTES - Attendance
router.post('/attendance/check-in', auth, authorize('manager'), validate(managerCheckInSchema), markCheckIn);
router.post('/attendance/check-out', auth, authorize('manager'), validate(managerCheckOutSchema), markCheckOut);
router.get('/attendance/shift/:shiftId', auth, authorize('manager'), getShiftAttendance);

// Dynamic Routes - Shifts
router.get('/:shiftId', auth, authorize('manager'), getShiftById);
router.put('/:shiftId', auth, authorize('manager'), validate(updateShiftSchema), updateShift);
router.delete('/:shiftId', auth, authorize('manager'), deleteShift);




module.exports = router;
