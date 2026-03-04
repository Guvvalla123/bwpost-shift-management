const express = require("express");
const { auth, authorize } = require("../middlewares/authMiddleware");
const {
    getAvailableShifts,
    getMyShifts,
    applyForShift,
    cancelShiftApplication,
    submitLeaveRequest,
    submitShiftChangeRequest,
    getMyRequests,
} = require("../controllers/employeeController");

const router = express.Router();

// View available shifts (upcoming, has open slots)
router.get("/Availableshifts", auth, authorize("employee"), getAvailableShifts);

// My accepted shifts
router.get("/myshifts", auth, authorize("employee"), getMyShifts);

// Apply / Cancel
router.post("/applyForShift", auth, authorize("employee"), applyForShift);
router.post("/cancelShift", auth, authorize("employee"), cancelShiftApplication);

// Leave request
router.post("/requests/leave", auth, authorize("employee"), submitLeaveRequest);

// Shift change request
router.post("/requests/shift-change", auth, authorize("employee"), submitShiftChangeRequest);

// View own requests
router.get("/requests", auth, authorize("employee"), getMyRequests);

module.exports = router;
