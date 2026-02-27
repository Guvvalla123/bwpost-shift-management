const express = require('express');
const { auth, authorize } = require('../middlewares/authMiddleware');
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
router.post('/', auth, authorize('manager'), createShift);
router.get('/', auth, authorize('manager'), getAllShiftsManager);
router.get('/dashboard/data', auth, authorize('manager'), require('../controllers/dashboardController').getDashboardData);

// MANAGER ROUTES - Employees
router.post('/employees', auth, authorize('manager'), createEmployee);
router.get('/employees', auth, authorize('manager'), getAllEmployees);
router.get('/employees/:employeeId', auth, authorize('manager'), getEmployeeById);
router.put('/employees/:employeeId', auth, authorize('manager'), updateEmployee);
router.delete('/employees/:employeeId', auth, authorize('manager'), deleteEmployee);
router.get('/employees/:employeeId/attendance', auth, authorize('manager'), getEmployeeAttendanceHistory);

// MANAGER ROUTES - Shift Employees
router.get('/shift-accepted-employees/:shiftId', auth, authorize('manager'), getShiftAcceptedEmployees);
router.post('/shift/assign-employee', auth, authorize('manager'), assignEmployeeToShift);
router.post('/shift/remove-employee', auth, authorize('manager'), removeEmployeeFromShift);

// MANAGER ROUTES - Attendance
router.post('/attendance/check-in', auth, authorize('manager'), markCheckIn);
router.post('/attendance/check-out', auth, authorize('manager'), markCheckOut);
router.get('/attendance/shift/:shiftId', auth, authorize('manager'), getShiftAttendance);

// Dynamic Routes - Shifts
router.get('/:shiftId', auth, authorize('manager'), getShiftById);
router.put('/:shiftId', auth, authorize('manager'), updateShift);
router.delete('/:shiftId', auth, authorize('manager'), deleteShift);




module.exports = router;
