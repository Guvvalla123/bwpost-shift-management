const mongoose = require("mongoose");
const ShiftRequest = require("../models/shiftRequestModel");
const Shift = require("../models/shiftModel");
const AppError = require("../utils/AppError");
const { log } = require("../utils/auditLog");
const { getPaginationParams, getPaginationMeta } = require("../utils/paginate");

const getAllRequests = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const { status, type, startDate, endDate, employeeId } = query;
  const filter = {};
  if (user.role === "manager") {
    const managerShiftIds = await Shift.find({ createdByManager: user.id }).distinct("_id");
    filter.currentShift = { $in: managerShiftIds };
  }
  if (status && ["pending", "approved", "rejected"].includes(status)) {
    filter.status = status;
  }
  if (type && ["leave", "shift_change"].includes(type)) {
    filter.type = type;
  }
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
  if (employeeId) {
    filter.employee = employeeId;
  }
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
  return {
    data: requests,
    pagination: getPaginationMeta(total, page, limit),
  };
};

const approveRequest = async (req, user, requestId, { managerNote }) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const request = await ShiftRequest.findById(requestId).session(session);
    if (!request) throw new AppError("Request not found", 404);
    if (request.status !== "pending") throw new AppError("Request already resolved", 400);

    const currentShiftDoc = await Shift.findById(request.currentShift).session(session);
    if (!currentShiftDoc) throw new AppError("Shift not found", 404);
    if (user.role === "manager" && currentShiftDoc.createdByManager.toString() !== user.id) {
      throw new AppError("You can only approve requests for your own shifts", 403);
    }

    const employeeId = request.employee;
    const now = new Date();

    if (request.type === "leave") {
      if (!currentShiftDoc.acceptedEmployees.some((id) => id.toString() === employeeId.toString())) {
        throw new AppError("Employee is not assigned to this shift", 400);
      }
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
      return { message: "Request approved successfully", data: request };
    }

    if (request.type === "shift_change") {
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

      await Shift.findByIdAndUpdate(
        currentShiftDoc._id,
        {
          $pull: { acceptedEmployees: employeeId },
          $inc: { slotsAvailable: 1 },
        },
        { session }
      );
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
      return { message: "Request approved successfully", data: request };
    }

    throw new AppError("Unknown request type", 400);
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const rejectRequest = async (req, user, requestId, { managerNote }) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const request = await ShiftRequest.findById(requestId).session(session);
    if (!request) throw new AppError("Request not found", 404);
    if (request.status !== "pending") throw new AppError("Request already resolved", 400);
    const currentShift = await Shift.findById(request.currentShift).session(session);
    if (!currentShift) throw new AppError("Shift not found", 404);
    if (user.role === "manager" && currentShift.createdByManager.toString() !== user.id) {
      throw new AppError("You can only reject requests for your own shifts", 403);
    }
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
    return { message: "Request rejected", data: request };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

module.exports = { getAllRequests, approveRequest, rejectRequest };
