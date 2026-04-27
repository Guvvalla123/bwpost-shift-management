// employeeController.js
// This file handles employee management
// and employee shift operations.
//
// MANAGER ROUTES:
// GET    /api/manager/shifts/employees
// POST   /api/manager/shifts/employees
// GET    /api/manager/shifts/employees/:id
// PUT    /api/manager/shifts/employees/:id
// DELETE /api/manager/shifts/employees/:id
// GET    /api/manager/shifts/employees/:id/attendance
// POST   /api/manager/shifts/employees/:id/reset-password-link
//
// EMPLOYEE ROUTES:
// GET  /api/employee/shifts/available-shifts
// GET  /api/employee/shifts/myshifts
// POST /api/employee/shifts/applyForShift
// POST /api/employee/shifts/cancelShift

const Shift = require("../models/Shift");
const ShiftRequest = require("../models/ShiftRequest");
const Attendance = require("../models/Attendance");
const User = require("../models/User");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/sendResponse");
const { log } = require("../helpers/auditLogger");
const { getPaginationParams, getPaginationMeta } = require("../helpers/pagination");
// Import the shared reset link utility from authController
const { createResetLink } = require("./authController");

// ─── MANAGER EMPLOYEE MANAGEMENT ─────────────────────────────────────────────

// getAllEmployees - gets all employees belonging to this manager
// Admin sees all employees, manager sees only their own team
exports.getAllEmployees = asyncHandler(async (req, res) => {
  const user = req.user;

  // Get pagination params from the query string
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);
  const { search = "" } = req.query;

  // Start with filtering by employee role
  const mongoQuery = { role: "employee" };

  // Managers can only see employees in their own team
  if (user.role === "manager") mongoQuery.managerId = user.id;

  // Search by username or email if provided
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    mongoQuery.$or = [
      { username: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }

  // Run both queries in parallel
  const [employees, total] = await Promise.all([
    User.find(mongoQuery)
      .select("username email managerId")
      .populate("managerId", "username email")
      .skip(skip)
      .limit(limit),
    User.countDocuments(mongoQuery),
  ]);

  return sendSuccess(res, 200, {
    data: employees,
    pagination: getPaginationMeta(total, page, limit),
  });
});

// createEmployee - manager creates a new employee account directly
// The new employee is automatically assigned to this manager
exports.createEmployee = asyncHandler(async (req, res) => {
  const user = req.user;
  const { username, email, password } = req.body;

  // All three fields are required
  if (!username || !email || !password) {
    throw new AppError("Username, email, and password are required", 400);
  }

  // Check no account already exists with this email
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new AppError("User with this email already exists", 400);

  // Create the employee account and link to this manager
  const employee = await User.create({
    username,
    email: email.toLowerCase(),
    password,
    role: "employee",
    managerId: user.id,
  });

  // Log the employee creation
  log("user.create", req, "User", employee._id, { role: "employee", managerId: user.id });

  return sendSuccess(res, 201, {
    message: "Employee created successfully",
    data: {
      _id: employee._id,
      username: employee.username,
      email: employee.email,
      role: employee.role,
    },
  });
});

// getEmployeeById - gets one employee's full details
// Manager can only view their own employees
exports.getEmployeeById = asyncHandler(async (req, res) => {
  const user = req.user;
  const { employeeId } = req.params;

  // Find the employee
  const employee = await User.findById(employeeId).select("username email role managerId createdAt");
  if (!employee) throw new AppError("Employee not found", 404);

  // Manager can only view employees in their own team
  if (user.role === "manager" && employee.managerId?.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }

  return sendSuccess(res, 200, { data: employee });
});

// updateEmployee - manager updates an employee's username or email
exports.updateEmployee = asyncHandler(async (req, res) => {
  const user = req.user;
  const { employeeId } = req.params;
  const body = req.body;

  // Find the employee
  const employee = await User.findById(employeeId);
  if (!employee) throw new AppError("Employee not found", 404);

  // Manager can only edit employees in their own team
  if (user.role === "manager" && employee.managerId?.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }

  // Cannot modify your own account from this route
  if (employeeId === user.id) throw new AppError("Cannot modify your own account", 400);

  // Only username and email can be updated
  const allowedUpdates = ["username", "email"];
  const updatedFields = allowedUpdates.filter((field) => body[field] !== undefined);
  for (const field of allowedUpdates) {
    if (body[field] !== undefined) employee[field] = body[field];
  }
  await employee.save();

  // Log the update
  log("manager.employee.update", req, "User", employeeId, {
    managerId: user.id,
    employeeId,
    updatedFields,
  });

  return sendSuccess(res, 200, {
    message: "Employee updated successfully",
    data: {
      _id: employee._id,
      username: employee.username,
      email: employee.email,
      role: employee.role,
    },
  });
});

// deleteEmployee - deactivates an employee account
// The account is not permanently deleted, only marked as inactive
exports.deleteEmployee = asyncHandler(async (req, res) => {
  const user = req.user;
  const { employeeId } = req.params;

  // Find the employee
  const employee = await User.findById(employeeId);
  if (!employee) throw new AppError("Employee not found", 404);

  // Manager can only deactivate their own employees
  if (user.role === "manager" && employee.managerId?.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }

  // Cannot delete your own account
  if (employeeId === user.id) throw new AppError("Cannot delete your own account", 400);

  // Remove this employee from all shifts they are assigned to
  await Shift.updateMany(
    { acceptedEmployees: employeeId },
    { $pull: { acceptedEmployees: employeeId } }
  );

  // Log the deactivation
  log("user.deactivate", req, "User", employee._id, { email: employee.email, role: employee.role });

  // Deactivate the account and clear their sessions
  const now = new Date();
  await User.findByIdAndUpdate(employeeId, {
    isActive: false,
    deactivatedAt: now,
    deactivatedBy: user.id,
    $unset: { refreshToken: 1, refreshTokens: 1 },
  });

  return sendSuccess(res, 200, { message: "Employee deactivated successfully" });
});

// getEmployeeAttendanceHistory - gets the attendance history for one employee
// Manager can filter by date range
exports.getEmployeeAttendanceHistory = asyncHandler(async (req, res) => {
  const user = req.user;
  const { employeeId } = req.params;
  const { startDate, endDate } = req.query;

  // Get pagination params
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);

  // Find the employee
  const employee = await User.findById(employeeId);
  if (!employee) throw new AppError("Employee not found", 404);

  // Manager can only view their own employees
  if (user.role === "manager" && employee.managerId?.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }

  // Build the attendance filter
  const filter = { employee: employeeId };

  // If date range provided, filter shifts by date first, then filter attendance
  if (startDate || endDate) {
    const shiftQuery = {};
    shiftQuery.shiftStartTime = {};
    if (startDate) shiftQuery.shiftStartTime.$gte = new Date(startDate);
    if (endDate) shiftQuery.shiftStartTime.$lte = new Date(endDate);
    const ids = await Shift.find(shiftQuery).distinct("_id");
    filter.shift = { $in: ids };
  }

  // Get attendance records with shift details
  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate("shift", "shiftTitle shiftStartTime shiftEndTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(filter),
  ]);

  // Format the records into a simple history array
  const attendanceHistory = records
    .map((r) => {
      if (!r.shift) return null;
      return {
        shiftId: r.shift._id,
        shiftTitle: r.shift.shiftTitle,
        shiftDate: r.shift.shiftStartTime,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        totalHours: r.totalHours,
      };
    })
    .filter((item) => item !== null);

  return sendSuccess(res, 200, {
    data: {
      employee: {
        _id: employee._id,
        username: employee.username,
        email: employee.email,
      },
      attendanceHistory,
    },
    pagination: getPaginationMeta(total, page, limit),
  });
});

// generateEmployeeResetLink - manager generates a reset link for their employee
// Admin can generate for anyone (except other admins)
exports.generateEmployeeResetLink = asyncHandler(async (req, res) => {
  const user = req.user;
  const { employeeId } = req.params;

  // Find the employee (include inactive)
  const employee = await User.findOne({ _id: employeeId, _includeInactive: true });
  if (!employee) throw new AppError("Employee not found", 404);

  // Cannot generate reset links for admin accounts
  if (employee.role === "admin") {
    throw new AppError("Password reset links cannot be generated for administrator accounts", 403);
  }

  // Admin can generate for anyone
  if (user.role === "admin") {
    const { resetLink, expiresAt } = await createResetLink(
      req,
      employee,
      "manager.password_reset_link"
    );
    return sendSuccess(res, 200, {
      message: "Password reset link generated",
      data: {
        resetLink,
        expiresAt: expiresAt.toISOString(),
        userEmail: employee.email,
      },
    });
  }

  // Manager can only generate for employees in their own team
  if (user.role === "manager") {
    if (employee.role !== "employee" || employee.managerId?.toString() !== user.id) {
      throw new AppError("This employee is not in your team", 403);
    }
    const { resetLink, expiresAt } = await createResetLink(
      req,
      employee,
      "manager.password_reset_link"
    );
    return sendSuccess(res, 200, {
      message: "Password reset link generated",
      data: {
        resetLink,
        expiresAt: expiresAt.toISOString(),
        userEmail: employee.email,
      },
    });
  }

  throw new AppError("Access denied", 403);
});

// ─── EMPLOYEE SELF-SERVICE SHIFT FUNCTIONS ────────────────────────────────────

// getAvailableShifts - employee views shifts they can apply for
// Shows upcoming shifts that still have open slots
exports.getAvailableShifts = asyncHandler(async (req, res) => {
  // Get pagination params from the query string
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);

  // Only show upcoming shifts with available slots
  const today = new Date();
  const mongoQuery = { shiftStartTime: { $gte: today }, slotsAvailable: { $gt: 0 } };

  // Run both queries in parallel
  const [shifts, total] = await Promise.all([
    Shift.find(mongoQuery)
      .populate("createdByManager", "username")
      .sort({ shiftStartTime: 1 })
      .skip(skip)
      .limit(limit),
    Shift.countDocuments(mongoQuery),
  ]);

  return sendSuccess(res, 200, {
    data: shifts,
    pagination: getPaginationMeta(total, page, limit),
  });
});

// getMyShifts - employee views all shifts they are assigned to
exports.getMyShifts = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;

  // Get pagination params from the query string
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);

  // Filter to only shifts where this employee is in the acceptedEmployees list
  const mongoQuery = { acceptedEmployees: employeeId };

  // Run both queries in parallel
  const [shifts, total] = await Promise.all([
    Shift.find(mongoQuery)
      .populate("createdByManager", "username email")
      .sort({ shiftStartTime: 1 })
      .skip(skip)
      .limit(limit),
    Shift.countDocuments(mongoQuery),
  ]);

  return sendSuccess(res, 200, {
    data: shifts,
    pagination: getPaginationMeta(total, page, limit),
  });
});

// applyForShift - employee applies to work a shift
// Adds them to the acceptedEmployees list and decrements available slots
exports.applyForShift = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  const { shiftId } = req.body;

  // Find the target shift to check availability and conflicts
  const targetShift = await Shift.findById(shiftId)
    .select("shiftStartTime shiftEndTime slotsAvailable acceptedEmployees")
    .lean();
  if (!targetShift) throw new AppError("Shift not found", 404);

  // Cannot apply for a shift they are already on
  if (targetShift.acceptedEmployees.some((id) => id.toString() === employeeId.toString())) {
    throw new AppError("You have already applied for this shift", 400);
  }

  // Check for time conflicts with other shifts this employee is already on
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

  // Add employee to the shift atomically (prevents race conditions)
  const shift = await Shift.findOneAndUpdate(
    {
      _id: shiftId,
      slotsAvailable: { $gt: 0 },
      acceptedEmployees: { $ne: employeeId },
    },
    { $push: { acceptedEmployees: employeeId }, $inc: { slotsAvailable: -1 } },
    { new: true }
  );

  // If update failed, find out why
  if (!shift) {
    const exists = await Shift.findById(shiftId);
    if (!exists) throw new AppError("Shift not found", 404);
    if (exists.acceptedEmployees.some((id) => id.toString() === employeeId)) {
      throw new AppError("You have already applied for this shift", 400);
    }
    throw new AppError("No slots available for this shift", 400);
  }

  log("employee.shift.apply", req, "Shift", shiftId, { employeeId, shiftId });

  return sendSuccess(res, 200, { message: "Successfully applied for the shift" });
});

// cancelShiftApplication - employee cancels their shift application
// Removes them from the shift and frees up their slot
exports.cancelShiftApplication = asyncHandler(async (req, res) => {
  const employeeId = req.user.id;
  const { shiftId } = req.body;

  // Find the shift
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);

  // Cannot cancel if they are not on this shift
  if (!shift.acceptedEmployees.some((id) => id.toString() === employeeId)) {
    throw new AppError("You have not applied for this shift", 400);
  }

  // Remove them from the shift and free the slot
  shift.acceptedEmployees = shift.acceptedEmployees.filter((id) => id.toString() !== employeeId);
  shift.slotsAvailable += 1;
  await shift.save();

  log("employee.shift.cancel", req, "Shift", shiftId, { employeeId, shiftId });

  return sendSuccess(res, 200, { message: "Successfully cancelled shift application" });
});

