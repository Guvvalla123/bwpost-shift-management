const express = require("express");
const { auth, authorize } = require("../middlewares/authMiddleware");
const { getAvailableShifts, applyForShift, cancelShiftApplication } = require("../controllers/employeeController");

const router = express.Router();

// EMPLOYEE ROUTES
router.get("/Availableshifts", auth, authorize("employee"), getAvailableShifts);
router.post("/applyForShift", auth, authorize("employee"), applyForShift);
router.post("/cancelShift", auth, authorize("employee"), cancelShiftApplication);

module.exports = router;
