const express = require("express");
const router = express.Router();

const { auth, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const {
  checkInSchema,
  checkOutSchema,
  startBreakSchema,
  endBreakSchema,
} = require("../validators/attendanceValidators");
const ctrl = require("../controllers/attendanceController");

router.post("/checkin", auth, validate(checkInSchema), ctrl.checkIn);
router.post("/checkout", auth, validate(checkOutSchema), ctrl.checkOut);
router.post("/break/start", auth, validate(startBreakSchema), ctrl.startBreak);
router.post("/break/end", auth, validate(endBreakSchema), ctrl.endBreak);

router.get(
  "/weekly-hours",
  auth,
  authorize("employee"),
  ctrl.getWeeklyHours
);

router.get("/my/:shiftId", auth, ctrl.getMyAttendance);

router.get("/shift/:shiftId", auth, authorize("admin", "manager"), ctrl.getShiftAttendance);

module.exports = router;
