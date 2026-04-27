// requestRoutes.js
// These routes handle shift requests.
// Managers approve or reject requests from employees.
//
// BASE URL: /api/manager/requests
//
// ALL ROUTES REQUIRE:
// isLoggedIn and checkRole("admin", "manager")
//
// AVAILABLE ROUTES:
// GET /api/manager/requests               - list all requests for this manager
// PUT /api/manager/requests/:id/approve   - approve a request
// PUT /api/manager/requests/:id/reject    - reject a request

const express = require("express");
const router = express.Router();

const { isLoggedIn } = require("../middleware/authMiddleware");
const { checkRole } = require("../middleware/checkRole");
const validateInput = require("../middleware/validateInput");

const { getAllRequests, approveRequest, rejectRequest } = require("../controllers/requestController");

const {
  approveRequestSchema,
  rejectRequestSchema,
  getRequestsQuerySchema,
} = require("../validation/requestValidation");

// GET /api/manager/requests
// Manager gets all leave and shift-change requests for their shifts
// Can filter by status (pending, approved, rejected) via query params
router.get(
  "/",
  isLoggedIn,
  checkRole("admin", "manager"),
  validateInput.validateQuery(getRequestsQuerySchema),
  getAllRequests
);

// PUT /api/manager/requests/:id/approve
// Manager approves a specific request
// Handles both leave requests and shift-change requests
// Updates request status to "approved"
router.put(
  "/:id/approve",
  isLoggedIn,
  checkRole("admin", "manager"),
  validateInput(approveRequestSchema),
  approveRequest
);

// PUT /api/manager/requests/:id/reject
// Manager rejects a specific request
// Manager can include a note explaining the rejection
// Updates request status to "rejected"
router.put(
  "/:id/reject",
  isLoggedIn,
  checkRole("admin", "manager"),
  validateInput(rejectRequestSchema),
  rejectRequest
);

module.exports = router;
