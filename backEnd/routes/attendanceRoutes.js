const express = require("express");
const router = express.Router();
const { authenticate, authorizeRoles } = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/attendanceController");

/* ── Both roles can check themselves in/out ── */
router.post("/checkin", authenticate, ctrl.checkIn);
router.post("/checkout", authenticate, ctrl.checkOut);
router.post("/break/start", authenticate, ctrl.startBreak);
router.post("/break/end", authenticate, ctrl.endBreak);

/* ── Employee: see their own attendance for a shift ── */
router.get("/my/:shiftId", authenticate, ctrl.getMyAttendance);

/* ── Manager: see full shift attendance ── */
router.get("/shift/:shiftId", authenticate, authorizeRoles("manager"), ctrl.getShiftAttendance);

module.exports = router;
