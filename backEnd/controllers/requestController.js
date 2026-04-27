// requestController.js
// This file handles shift requests.
// Employees submit leave or shift change requests.
// Managers approve or reject them.
//
// MANAGER ROUTES:
// GET /api/manager/requests
// PUT /api/manager/requests/:id/approve
// PUT /api/manager/requests/:id/reject
//
// EMPLOYEE ROUTES:
// POST /api/employee/shifts/requests/leave
// POST /api/employee/shifts/requests/shift-change
// GET  /api/employee/shifts/requests

const mongoose = require("mongoose");
const ShiftRequest = require("../models/ShiftRequest");
const Shift = require("../models/Shift");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/sendResponse");
const { log } = require("../helpers/auditLogger");
const { getPaginationParams, getPaginationMeta } = require("../helpers/pagination");

// ─── MANAGER FUNCTIONS ────────────────────────────────────────────────────────

// getAllRequests - gets all shift requests for this manager to review
// Can filter by status (pending, approved, rejected) and request type
exports.getAllRequests = asyncHandler(async (req, res) => {
  const user = req.user;

  // Get pagination params from the query string
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);
  const { status, type, startDate, endDate, employeeId } = req.query;

  const filter = {};

  // Managers only see requests for their own shifts
  if (user.role === "manager") {
    const managerShiftIds = await Shift.find({ createdByManager: user.id }).distinct("_id");
    filter.currentShift = { $in: managerShiftIds };
  }

  // Filter by request status if provided
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    filter.status = status;
  }

  // Filter by request type if provided
  if (type && ["leave", "shift_change"].includes(type)) {
    filter.type = type;
  }

  // Filter by date range if provided
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) {
      filter.createdAt.$gte = startDate instanceof Date ? startDate : new Date(startDate);
    }
    if (endDate) {
      const end = endDate instanceof Date ? new Date(endDate) : new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.createdAt.$lte = end;
    }
  }

  // Filter by specific employee if provided
  if (employeeId) {
    filter.employee = employeeId;
  }

  // Run both queries in parallel for speed
  const [requests, total] = await Promise.all([
    ShiftRequest.find(filter)
      .populate("employee", "username email profileImage")
      .populate("currentShift", "shiftTitle shiftStartTime shiftEndTime")
      .populate("requestedShift", "shiftTitle shiftStartTime shiftEndTime slotsAvailable")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ShiftRequest.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, {
    data: requests,
    pagination: getPaginationMeta(total, page, limit),
  });
});

// approveRequest - manager approves a leave or shift change request
// For leave: removes employee from the shift and frees up a slot
// For shift change: moves employee from old shift to new shift
exports.approveRequest = asyncHandler(async (req, res) => {
  const user = req.user;
  const requestId = req.params.id;
  const { managerNote } = req.body;

  // Use a database transaction to ensure all changes happen together or not at all
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Find the request
    const request = await ShiftRequest.findById(requestId).session(session);
    if (!request) throw new AppError("Request not found", 404);
    if (request.status !== "pending") throw new AppError("Request already resolved", 400);

    // Find the current shift and verify manager ownership
    const currentShiftDoc = await Shift.findById(request.currentShift).session(session);
    if (!currentShiftDoc) throw new AppError("Shift not found", 404);
    if (user.role === "manager" && currentShiftDoc.createdByManager.toString() !== user.id) {
      throw new AppError("You can only approve requests for your own shifts", 403);
    }

    const employeeId = request.employee;
    const now = new Date();

    // Handle leave request approval
    if (request.type === "leave") {
      // Verify employee is still on this shift
      if (!currentShiftDoc.acceptedEmployees.some((id) => id.toString() === employeeId.toString())) {
        throw new AppError("Employee is not assigned to this shift", 400);
      }

      // Remove employee from shift and free up their slot
      await Shift.findByIdAndUpdate(
        request.currentShift,
        {
          $pull: { acceptedEmployees: employeeId },
          $inc: { slotsAvailable: 1 },
        },
        { session }
      );

      request.status = "approved";
      request.managerNote = managerNote || "";
      request.resolvedAt = now;
      await request.save({ session });
      await session.commitTransaction();

      log("request.approve", req, "ShiftRequest", request._id, {
        type: "leave",
        employeeId: employeeId.toString(),
        managerId: user.id,
      });

      return sendSuccess(res, 200, { message: "Request approved successfully", data: request });
    }

    // Handle shift change request approval
    if (request.type === "shift_change") {
      // Find the requested (destination) shift
      const requestedShiftDoc = await Shift.findById(request.requestedShift).session(session);
      if (!requestedShiftDoc) throw new AppError("Requested shift no longer exists", 404);
      if (requestedShiftDoc.slotsAvailable <= 0) {
        throw new AppError("Requested shift is now full", 400);
      }
      if (requestedShiftDoc.acceptedEmployees.some((id) => id.toString() === employeeId.toString())) {
        throw new AppError("Employee is already assigned to the requested shift", 400);
      }
      if (!currentShiftDoc.acceptedEmployees.some((id) => id.toString() === employeeId.toString())) {
        throw new AppError("Employee is not assigned to the current shift", 400);
      }

      // Remove from old shift
      await Shift.findByIdAndUpdate(
        currentShiftDoc._id,
        {
          $pull: { acceptedEmployees: employeeId },
          $inc: { slotsAvailable: 1 },
        },
        { session }
      );

      // Add to new shift
      await Shift.findByIdAndUpdate(
        requestedShiftDoc._id,
        {
          $push: { acceptedEmployees: employeeId },
          $inc: { slotsAvailable: -1 },
        },
        { session }
      );

      request.status = "approved";
      request.managerNote = managerNote || "";
      request.resolvedAt = now;
      await request.save({ session });
      await session.commitTransaction();

      log("request.approve", req, "ShiftRequest", request._id, {
        type: "shift_change",
        employeeId: employeeId.toString(),
        managerId: user.id,
        fromShift: currentShiftDoc._id,
        toShift: requestedShiftDoc._id,
      });

      return sendSuccess(res, 200, { message: "Request approved successfully", data: request });
    }

    throw new AppError("Unknown request type", 400);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// rejectRequest - manager rejects a leave or shift change request
// Saves the manager's note explaining why it was rejected
exports.rejectRequest = asyncHandler(async (req, res) => {
  const user = req.user;
  const requestId = req.params.id;
  const { managerNote } = req.body;

  // Use a transaction so the status update is atomic
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const request = await ShiftRequest.findById(requestId).session(session);
    if (!request) throw new AppError("Request not found", 404);
    if (request.status !== "pending") throw new AppError("Request already resolved", 400);

    // Find current shift and verify manager ownership
    const currentShift = await Shift.findById(request.currentShift).session(session);
    if (!currentShift) throw new AppError("Shift not found", 404);
    if (user.role === "manager" && currentShift.createdByManager.toString() !== user.id) {
      throw new AppError("You can only reject requests for your own shifts", 403);
    }

    // Mark the request as rejected with the manager note
    request.status = "rejected";
    request.managerNote = managerNote || "";
    request.resolvedAt = new Date();
    await request.save({ session });
    await session.commitTransaction();

    log("request.reject", req, "ShiftRequest", request._id, {
      type: request.type,
      employeeId: request.employee.toString(),
      managerId: user.id,
    });

    return sendSuccess(res, 200, { message: "Request rejected", data: request });
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
});

// ─── EMPLOYEE FUNCTIONS ───────────────────────────────────────────────────────

// createLeaveRequest - employee submits a leave request for a shift they are on
// Manager will review and approve or reject it
exports.createLeaveRequest = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  const { shiftId, reason } = req.body;

  // Verify the shift exists
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);

  // Verify the employee is assigned to this shift
  if (!shift.acceptedEmployees.some((id) => id.toString() === employeeId)) {
    throw new AppError("You are not assigned to this shift", 400);
  }

  // Check if a pending leave request already exists for this shift
  const existing = await ShiftRequest.findOne({
    employee: employeeId,
    currentShift: shiftId,
    type: "leave",
    status: "pending",
  });
  if (existing) {
    throw new AppError("You already have a pending leave request for this shift", 400);
  }

  // Create the leave request
  const request = await ShiftRequest.create({
    type: "leave",
    employee: employeeId,
    currentShift: shiftId,
    reason: reason || "",
  });

  log("employee.request.leave", req, "ShiftRequest", request._id, {
    employeeId,
    shiftId,
    reason,
  });

  return sendSuccess(res, 201, {
    message: "Leave request submitted successfully",
    data: request,
  });
});

// createShiftChangeRequest - employee requests to swap to a different shift
// Manager will review and approve or reject the swap
exports.createShiftChangeRequest = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  const { currentShiftId, requestedShiftId, reason } = req.body;

  // Load both shifts at the same time
  const [currentShift, requestedShift] = await Promise.all([
    Shift.findById(currentShiftId),
    Shift.findById(requestedShiftId),
  ]);

  if (!currentShift) throw new AppError("Current shift not found", 404);
  if (!requestedShift) throw new AppError("Requested shift not found", 404);

  // Employee must be on the current shift to request leaving it
  if (!currentShift.acceptedEmployees.some((id) => id.toString() === employeeId)) {
    throw new AppError("You are not assigned to the current shift", 400);
  }

  // The requested shift must have available slots
  if (requestedShift.slotsAvailable <= 0) {
    throw new AppError("Requested shift has no available slots", 400);
  }

  // Check if a pending shift change request already exists
  const existing = await ShiftRequest.findOne({
    employee: employeeId,
    currentShift: currentShiftId,
    type: "shift_change",
    status: "pending",
  });
  if (existing) throw new AppError("You already have a pending shift change request", 400);

  // Create the shift change request
  const request = await ShiftRequest.create({
    type: "shift_change",
    employee: employeeId,
    currentShift: currentShiftId,
    requestedShift: requestedShiftId,
    reason: reason || "",
  });

  log("employee.request.shift_change", req, "ShiftRequest", request._id, {
    employeeId,
    currentShiftId,
    requestedShiftId,
  });

  return sendSuccess(res, 201, {
    message: "Shift change request submitted successfully",
    data: request,
  });
});

// getMyRequests - employee views all their own requests and their statuses
exports.getMyRequests = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;

  // Get pagination params from query string
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);

  // Filter to only this employee's requests
  const mongoQuery = { employee: employeeId };

  // Run both queries in parallel
  const [requests, total] = await Promise.all([
    ShiftRequest.find(mongoQuery)
      .populate("currentShift", "shiftTitle shiftStartTime shiftEndTime")
      .populate("requestedShift", "shiftTitle shiftStartTime shiftEndTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ShiftRequest.countDocuments(mongoQuery),
  ]);

  return sendSuccess(res, 200, {
    data: requests,
    pagination: getPaginationMeta(total, page, limit),
  });
});

