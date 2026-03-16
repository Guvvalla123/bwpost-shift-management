const express = require("express");
const { auth, authorize } = require("../middlewares/authMiddleware");
const validate = require("../middlewares/validate");
const { getAllRequests, approveRequest, rejectRequest } = require("../controllers/requestController");
const { approveRequestSchema, rejectRequestSchema } = require("../validators/requestValidators");

const router = express.Router();

// Get all leave/shift-change requests for this manager's shifts
router.get("/", auth, authorize("manager"), getAllRequests);

// Approve a request (handles both leave + shift_change logic)
router.put("/:id/approve", auth, authorize("manager"), validate(approveRequestSchema), approveRequest);

// Reject a request
router.put("/:id/reject", auth, authorize("manager"), validate(rejectRequestSchema), rejectRequest);

module.exports = router;
