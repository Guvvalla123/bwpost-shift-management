const Shift = require("../models/shiftModel");
const ShiftRequest = require("../models/shiftRequestModel");
const User = require("../models/userModel");
const Attendance = require("../models/attendanceModel");
const AppError = require("../utils/AppError");
const { log } = require("../utils/auditLog");
const { getPaginationParams, getPaginationMeta } = require("../utils/paginate");

const getAllShiftsPublic = async (query = {}) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const mongoQuery = {
    shiftStartTime: { $gte: new Date() },
    slotsAvailable: { $gt: 0 },
  };
  const [shifts, total] = await Promise.all([
    Shift.find(mongoQuery)
      .select("_id shiftTitle shiftStartTime shiftEndTime slotsAvailable shiftNotes")
      .sort({ shiftStartTime: 1 })
      .skip(skip)
      .limit(limit),
    Shift.countDocuments(mongoQuery),
  ]);
  return {
    message: "Upcoming shifts fetched successfully",
    data: shifts,
    pagination: getPaginationMeta(total, page, limit),
  };
};

const createShift = async (req, userId, body) => {
  const { shiftTitle, shiftStartTime, shiftEndTime, shiftNotes, slotsAvailable } = body;
  if (!shiftTitle || !shiftStartTime || !shiftEndTime || !slotsAvailable) {
    throw new AppError("Required fields are missing", 400);
  }
  const shift = await Shift.create({
    shiftTitle,
    shiftStartTime,
    shiftEndTime,
    shiftNotes,
    slotsAvailable,
    createdByManager: userId,
  });
  log("shift.create", req, "Shift", shift._id, { shiftTitle: shift.shiftTitle });
  return { message: "Shift created successfully", data: shift };
};

const mergeShiftStartTimeRange = (existing, range) => {
  if (!range || (range.$gte == null && range.$lte == null)) return existing;
  const out =
    existing && typeof existing === "object" && !Array.isArray(existing) ? { ...existing } : {};
  if (range.$gte != null) {
    const r = range.$gte.getTime();
    if (out.$gte !== undefined) {
      out.$gte = new Date(Math.max(new Date(out.$gte).getTime(), r));
    } else {
      out.$gte = range.$gte;
    }
  }
  if (range.$lte != null) {
    const r = range.$lte.getTime();
    if (out.$lte !== undefined) {
      out.$lte = new Date(Math.min(new Date(out.$lte).getTime(), r));
    } else {
      out.$lte = range.$lte;
    }
  }
  return Object.keys(out).length ? out : existing;
};

const getAllShiftsManager = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const status =
    query.status == null || query.status === "" ? "all" : query.status;
  const search = query.search == null || query.search === "" ? "" : String(query.search);
  const mongoQuery = {};
  if (user.role === "manager") mongoQuery.createdByManager = user.id;
  const now = new Date();
  if (status === "upcoming") mongoQuery.shiftStartTime = { $gte: now };
  else if (status === "ongoing") {
    mongoQuery.shiftStartTime = { $lte: now };
    mongoQuery.shiftEndTime = { $gte: now };
  } else if (status === "completed" || status === "past") {
    mongoQuery.shiftEndTime = { $lt: now };
  }
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    mongoQuery.shiftTitle = { $regex: escaped, $options: "i" };
  }
  if (query.startDate || query.endDate) {
    const range = {};
    if (query.startDate) {
      range.$gte = query.startDate instanceof Date ? query.startDate : new Date(query.startDate);
    }
    if (query.endDate) {
      const end = query.endDate instanceof Date ? new Date(query.endDate) : new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
      range.$lte = end;
    }
    const merged = mergeShiftStartTimeRange(mongoQuery.shiftStartTime, range);
    if (merged) mongoQuery.shiftStartTime = merged;
  }
  const sortDir = query.sort === "asc" ? 1 : -1;
  const [shifts, total] = await Promise.all([
    Shift.find(mongoQuery)
      .populate("acceptedEmployees", "username email profileImage")
      .sort({ shiftStartTime: sortDir })
      .skip(skip)
      .limit(limit),
    Shift.countDocuments(mongoQuery),
  ]);
  return {
    message: "Shifts fetched successfully",
    data: shifts,
    pagination: getPaginationMeta(total, page, limit),
  };
};

const assertManagerOwnsShift = (user, shift) => {
  if (user.role === "manager" && shift.createdByManager.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }
};

const getShiftById = async (user, shiftId) => {
  const shift = await Shift.findById(shiftId)
    .populate("acceptedEmployees", "username email");
  if (!shift) throw new AppError("Shift not found", 404);
  assertManagerOwnsShift(user, shift);
  return { data: shift };
};

const updateShift = async (req, user, shiftId, body) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);
  assertManagerOwnsShift(user, shift);
  const allowedUpdates = [
    "shiftTitle",
    "shiftStartTime",
    "shiftEndTime",
    "shiftNotes",
    "slotsAvailable",
  ];
  allowedUpdates.forEach((field) => {
    if (body[field] !== undefined) shift[field] = body[field];
  });
  await shift.save();
  log("shift.update", req, "Shift", shift._id, { shiftTitle: shift.shiftTitle });
  return { message: "Shift updated successfully", data: shift };
};

const deleteShift = async (req, user, shiftId) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);
  assertManagerOwnsShift(user, shift);
  const now = new Date();
  const cancelResult = await ShiftRequest.updateMany(
    {
      status: "pending",
      $or: [
        { currentShift: shift._id },
        { requestedShift: shift._id },
      ],
    },
    {
      $set: {
        status: "rejected",
        managerNote: "Shift was deleted",
        resolvedAt: now,
      },
    }
  );
  log("shift.delete", req, "Shift", shift._id, { shiftTitle: shift.shiftTitle, deletedBy: user.id });
  await shift.deleteOne();
  if (cancelResult.modifiedCount > 0) {
    log("SHIFT_DELETED_REQUESTS_CANCELLED", req, "ShiftRequest", shift._id, {
      cancelledRequests: cancelResult.modifiedCount,
      shiftId: shift._id.toString(),
      reason: "Shift deleted",
      deletedBy: user.id,
    });
  }
  return { message: "Shift deleted successfully" };
};

const getShiftAcceptedEmployees = async (managerUserId, shiftId) => {
  const shift = await Shift.findById(shiftId).populate("acceptedEmployees", "username email");
  if (!shift) throw new AppError("Shift not found", 404);
  if (shift.createdByManager.toString() !== managerUserId) {
    throw new AppError("Access denied", 403);
  }
  return { data: shift.acceptedEmployees };
};

const removeEmployeeFromShift = async (req, user, body) => {
  const { shiftId, employeeId } = body;
  if (!shiftId || !employeeId) throw new AppError("shiftId and employeeId are required", 400);
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);
  if (user.role === "manager" && shift.createdByManager.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }
  shift.acceptedEmployees = shift.acceptedEmployees.filter((id) => id.toString() !== employeeId);
  shift.slotsAvailable += 1;
  await shift.save();
  log("shift.remove_employee", req, "Shift", shift._id, { employeeId, shiftTitle: shift.shiftTitle });
  try {
    const deletedAttendance = await Attendance.deleteOne({
      shift: shiftId,
      employee: employeeId,
    });
    if (deletedAttendance.deletedCount > 0) {
      log("ATTENDANCE_CLEANED_ON_REMOVE", req, "Attendance", shiftId, {
        shiftId,
        employeeId,
        reason: "Employee removed from shift",
      });
    }
  } catch (cleanupErr) {
    console.error("Attendance cleanup failed:", cleanupErr.message);
  }
  return { message: "Employee removed from shift successfully" };
};

const assignEmployeeToShift = async (req, user, body) => {
  const { shiftId, employeeId } = body;
  if (!shiftId || !employeeId) throw new AppError("shiftId and employeeId are required", 400);
  const employee = await User.findById(employeeId);
  if (!employee) throw new AppError("Employee not found", 404);
  if (employee.role !== "employee") throw new AppError("User is not an employee", 400);
  if (user.role === "manager" && employee.managerId?.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }
  const targetShift = await Shift.findById(shiftId)
    .select("shiftStartTime shiftEndTime")
    .lean();
  if (!targetShift) throw new AppError("Shift not found", 404);
  const overlapping = await Shift.findOne({
    acceptedEmployees: { $in: [employeeId] },
    _id: { $ne: shiftId },
    shiftStartTime: { $lt: targetShift.shiftEndTime },
    shiftEndTime: { $gt: targetShift.shiftStartTime },
  })
    .select("shiftTitle shiftStartTime shiftEndTime")
    .lean();
  if (overlapping) {
    throw new AppError(
      `One or more employees already have a shift during this time: "${overlapping.shiftTitle}"`,
      409
    );
  }
  const shiftFilter = {
    _id: shiftId,
    slotsAvailable: { $gt: 0 },
    acceptedEmployees: { $ne: employeeId },
  };
  if (user.role === "manager") shiftFilter.createdByManager = user.id;
  const shift = await Shift.findOneAndUpdate(
    shiftFilter,
    { $push: { acceptedEmployees: employeeId }, $inc: { slotsAvailable: -1 } },
    { new: true }
  );
  if (!shift) {
    const existing = await Shift.findById(shiftId);
    if (!existing) throw new AppError("Shift not found", 404);
    if (user.role === "manager" && existing.createdByManager.toString() !== user.id) {
      throw new AppError("Access denied", 403);
    }
    if (existing.acceptedEmployees.some((id) => id.toString() === employeeId)) {
      throw new AppError("Employee already assigned to this shift", 400);
    }
    throw new AppError("No slots available for this shift", 400);
  }
  log("shift.assign_employee", req, "Shift", shift._id, { employeeId, shiftTitle: shift.shiftTitle });
  return { message: "Employee assigned to shift successfully" };
};

module.exports = {
  getAllShiftsPublic,
  createShift,
  getAllShiftsManager,
  getShiftById,
  updateShift,
  deleteShift,
  getShiftAcceptedEmployees,
  removeEmployeeFromShift,
  assignEmployeeToShift,
};
