const Shift = require("../models/shiftModel");
const ShiftRequest = require("../models/shiftRequestModel");
const AppError = require("../utils/AppError");
const { log } = require("../utils/auditLog");
const { getPaginationParams, getPaginationMeta } = require("../utils/paginate");

const getAvailableShifts = async (query) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const today = new Date();
  const mongoQuery = { shiftStartTime: { $gte: today }, slotsAvailable: { $gt: 0 } };
  const [shifts, total] = await Promise.all([
    Shift.find(mongoQuery)
      .populate("createdByManager", "username")
      .sort({ shiftStartTime: 1 })
      .skip(skip)
      .limit(limit),
    Shift.countDocuments(mongoQuery),
  ]);
  return {
    data: shifts,
    pagination: getPaginationMeta(total, page, limit),
  };
};

const getMyShifts = async (employeeId, query) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const mongoQuery = { acceptedEmployees: employeeId };
  const [shifts, total] = await Promise.all([
    Shift.find(mongoQuery)
      .populate("createdByManager", "username email")
      .sort({ shiftStartTime: 1 })
      .skip(skip)
      .limit(limit),
    Shift.countDocuments(mongoQuery),
  ]);
  return {
    data: shifts,
    pagination: getPaginationMeta(total, page, limit),
  };
};

const applyForShift = async (req, employeeId, shiftId) => {
  const targetShift = await Shift.findById(shiftId)
    .select("shiftStartTime shiftEndTime slotsAvailable acceptedEmployees")
    .lean();
  if (!targetShift) throw new AppError("Shift not found", 404);
  if (targetShift.acceptedEmployees.some((id) => id.toString() === employeeId.toString())) {
    throw new AppError("You have already applied for this shift", 400);
  }
  const overlapping = await Shift.findOne({
    acceptedEmployees: employeeId,
    _id: { $ne: shiftId },
    shiftStartTime: { $lt: targetShift.shiftEndTime },
    shiftEndTime: { $gt: targetShift.shiftStartTime },
  })
    .select("shiftTitle shiftStartTime shiftEndTime")
    .lean();
  if (overlapping) {
    throw new AppError(
      `You already have a shift during this time period: "${overlapping.shiftTitle}"`,
      409
    );
  }
  const shift = await Shift.findOneAndUpdate(
    {
      _id: shiftId,
      slotsAvailable: { $gt: 0 },
      acceptedEmployees: { $ne: employeeId },
    },
    { $push: { acceptedEmployees: employeeId }, $inc: { slotsAvailable: -1 } },
    { new: true }
  );
  if (!shift) {
    const exists = await Shift.findById(shiftId);
    if (!exists) throw new AppError("Shift not found", 404);
    if (exists.acceptedEmployees.some((id) => id.toString() === employeeId)) {
      throw new AppError("You have already applied for this shift", 400);
    }
    throw new AppError("No slots available for this shift", 400);
  }
  log("employee.shift.apply", req, "Shift", shiftId, { employeeId, shiftId });
  return { message: "Successfully applied for the shift" };
};

const cancelShiftApplication = async (req, employeeId, shiftId) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);
  if (!shift.acceptedEmployees.some((id) => id.toString() === employeeId)) {
    throw new AppError("You have not applied for this shift", 400);
  }
  shift.acceptedEmployees = shift.acceptedEmployees.filter((id) => id.toString() !== employeeId);
  shift.slotsAvailable += 1;
  await shift.save();
  log("employee.shift.cancel", req, "Shift", shiftId, { employeeId, shiftId });
  return { message: "Successfully cancelled shift application" };
};

const submitLeaveRequest = async (req, employeeId, { shiftId, reason }) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);
  if (!shift.acceptedEmployees.some((id) => id.toString() === employeeId)) {
    throw new AppError("You are not assigned to this shift", 400);
  }
  const existing = await ShiftRequest.findOne({
    employee: employeeId,
    currentShift: shiftId,
    type: "leave",
    status: "pending",
  });
  if (existing) {
    throw new AppError("You already have a pending leave request for this shift", 400);
  }
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
  return {
    message: "Leave request submitted successfully",
    data: request,
  };
};

const submitShiftChangeRequest = async (req, employeeId, { currentShiftId, requestedShiftId, reason }) => {
  const [currentShift, requestedShift] = await Promise.all([
    Shift.findById(currentShiftId),
    Shift.findById(requestedShiftId),
  ]);
  if (!currentShift) throw new AppError("Current shift not found", 404);
  if (!requestedShift) throw new AppError("Requested shift not found", 404);
  if (!currentShift.acceptedEmployees.some((id) => id.toString() === employeeId)) {
    throw new AppError("You are not assigned to the current shift", 400);
  }
  if (requestedShift.slotsAvailable <= 0) {
    throw new AppError("Requested shift has no available slots", 400);
  }
  const existing = await ShiftRequest.findOne({
    employee: employeeId,
    currentShift: currentShiftId,
    type: "shift_change",
    status: "pending",
  });
  if (existing) throw new AppError("You already have a pending shift change request", 400);
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
  return {
    message: "Shift change request submitted successfully",
    data: request,
  };
};

const getMyRequests = async (employeeId, query) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const mongoQuery = { employee: employeeId };
  const [requests, total] = await Promise.all([
    ShiftRequest.find(mongoQuery)
      .populate("currentShift", "shiftTitle shiftStartTime shiftEndTime")
      .populate("requestedShift", "shiftTitle shiftStartTime shiftEndTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    ShiftRequest.countDocuments(mongoQuery),
  ]);
  return {
    data: requests,
    pagination: getPaginationMeta(total, page, limit),
  };
};

module.exports = {
  getAvailableShifts,
  getMyShifts,
  applyForShift,
  cancelShiftApplication,
  submitLeaveRequest,
  submitShiftChangeRequest,
  getMyRequests,
};
