const express = require("express");
const router = express.Router();

const { auth, authorize } = require("../middlewares/authMiddleware");
const ctrl = require("../controllers/attendanceController");

router.post("/checkin", auth, ctrl.checkIn);
router.post("/checkout", auth, ctrl.checkOut);
router.post("/break/start", auth, ctrl.startBreak);
router.post("/break/end", auth, ctrl.endBreak);

router.get("/my/:shiftId", auth, ctrl.getMyAttendance);

router.get("/shift/:shiftId", auth, authorize("manager"), ctrl.getShiftAttendance);

module.exports = router;