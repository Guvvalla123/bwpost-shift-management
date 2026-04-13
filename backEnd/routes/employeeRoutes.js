const express = require("express");
const { auth, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const {
  applyForShiftSchema,
  cancelShiftSchema,
  leaveRequestSchema,
  shiftChangeRequestSchema,
} = require("../validators/employeeValidators");
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
router.get("/available-shifts", auth, authorize("employee"), getAvailableShifts);

// My accepted shifts
router.get("/myshifts", auth, authorize("employee"), getMyShifts);

// Apply / Cancel
router.post("/applyForShift", auth, authorize("employee"), validate(applyForShiftSchema), applyForShift);
router.post("/cancelShift", auth, authorize("employee"), validate(cancelShiftSchema), cancelShiftApplication);

// Leave request
router.post("/requests/leave", auth, authorize("employee"), validate(leaveRequestSchema), submitLeaveRequest);

// Shift change request
router.post("/requests/shift-change", auth, authorize("employee"), validate(shiftChangeRequestSchema), submitShiftChangeRequest);

// View own requests
router.get("/requests", auth, authorize("employee"), getMyRequests);

module.exports = router;
