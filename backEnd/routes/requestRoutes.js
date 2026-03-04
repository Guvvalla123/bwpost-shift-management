const express = require("express");
const { auth, authorize } = require("../middlewares/authMiddleware");
const { getAllRequests, approveRequest, rejectRequest } = require("../controllers/requestController");

const router = express.Router();

// Get all leave/shift-change requests for this manager's shifts
router.get("/", auth, authorize("manager"), getAllRequests);

// Approve a request (handles both leave + shift_change logic)
router.put("/:id/approve", auth, authorize("manager"), approveRequest);

// Reject a request
router.put("/:id/reject", auth, authorize("manager"), rejectRequest);

module.exports = router;
