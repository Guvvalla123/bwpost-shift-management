const Shift = require("../models/shiftModel");
const Attendance = require("../models/attendanceModel");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const { log } = require("../utils/auditLog");
const { getPaginationParams, getPaginationMeta } = require("../utils/paginate");
const userService = require("./userService");

const getAllEmployees = async (user, query) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const { search = "" } = query;
  const mongoQuery = { role: "employee" };
  if (user.role === "manager") mongoQuery.managerId = user.id;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    mongoQuery.$or = [
      { username: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ];
  }
  const [employees, total] = await Promise.all([
    User.find(mongoQuery)
      .select("username email managerId")
      .populate("managerId", "username email")
      .skip(skip)
      .limit(limit),
    User.countDocuments(mongoQuery),
  ]);
  return {
    data: employees,
    pagination: getPaginationMeta(total, page, limit),
  };
};

const createEmployee = async (req, managerId, body) => {
  const { username, email, password } = body;
  if (!username || !email || !password) {
    throw new AppError("Username, email, and password are required", 400);
  }
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) throw new AppError("User with this email already exists", 400);
  const employee = await User.create({
    username,
    email: email.toLowerCase(),
    password,
    role: "employee",
    managerId,
  });
  log("user.create", req, "User", employee._id, { role: "employee", managerId });
  return {
    message: "Employee created successfully",
    data: {
      _id: employee._id,
      username: employee.username,
      email: employee.email,
      role: employee.role,
    },
  };
};

const updateEmployee = async (req, user, employeeId, body) => {
  const employee = await User.findById(employeeId);
  if (!employee) throw new AppError("Employee not found", 404);
  if (user.role === "manager" && employee.managerId?.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }
  if (employeeId === user.id) throw new AppError("Cannot modify your own account", 400);
  const allowedUpdates = ["username", "email"];
  const updatedFields = allowedUpdates.filter((field) => body[field] !== undefined);
  for (const field of allowedUpdates) {
    if (body[field] !== undefined) employee[field] = body[field];
  }
  await employee.save();
  log("manager.employee.update", req, "User", employeeId, {
    managerId: user.id,
    employeeId,
    updatedFields,
  });
  return {
    message: "Employee updated successfully",
    data: {
      _id: employee._id,
      username: employee.username,
      email: employee.email,
      role: employee.role,
    },
  };
};

const deleteEmployee = async (req, user, employeeId) => {
  const employee = await User.findById(employeeId);
  if (!employee) throw new AppError("Employee not found", 404);
  if (user.role === "manager" && employee.managerId?.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }
  if (employeeId === user.id) throw new AppError("Cannot delete your own account", 400);
  await Shift.updateMany(
    { acceptedEmployees: employeeId },
    { $pull: { acceptedEmployees: employeeId } }
  );
  log("user.deactivate", req, "User", employee._id, { email: employee.email, role: employee.role });
  const now = new Date();
  await User.findByIdAndUpdate(employeeId, {
    isActive: false,
    deactivatedAt: now,
    deactivatedBy: user.id,
    $unset: { refreshToken: 1, refreshTokens: 1 },
  });
  return { message: "Employee deactivated successfully" };
};

const getEmployeeById = async (user, employeeId) => {
  const employee = await User.findById(employeeId).select("username email role managerId createdAt");
  if (!employee) throw new AppError("Employee not found", 404);
  if (user.role === "manager" && employee.managerId?.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }
  return { data: employee };
};

const getEmployeeAttendanceHistory = async (user, employeeId, query) => {
  const { page, limit, skip } = getPaginationParams(query, 20, 50);
  const { startDate, endDate } = query;
  const employee = await User.findById(employeeId);
  if (!employee) throw new AppError("Employee not found", 404);
  if (user.role === "manager" && employee.managerId?.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }
  const filter = { employee: employeeId };
  if (startDate || endDate) {
    const shiftQuery = {};
    shiftQuery.shiftStartTime = {};
    if (startDate) shiftQuery.shiftStartTime.$gte = new Date(startDate);
    if (endDate) shiftQuery.shiftStartTime.$lte = new Date(endDate);
    const ids = await Shift.find(shiftQuery).distinct("_id");
    filter.shift = { $in: ids };
  }
  const [records, total] = await Promise.all([
    Attendance.find(filter)
      .populate("shift", "shiftTitle shiftStartTime shiftEndTime")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Attendance.countDocuments(filter),
  ]);
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
  return {
    data: {
      employee: {
        _id: employee._id,
        username: employee.username,
        email: employee.email,
      },
      attendanceHistory,
    },
    pagination: getPaginationMeta(total, page, limit),
  };
};

const generateEmployeePasswordResetLink = async (req, user, employeeId) => {
  const employee = await User.findOne({ _id: employeeId, _includeInactive: true });
  if (!employee) throw new AppError("Employee not found", 404);
  if (employee.role === "admin") {
    throw new AppError("Password reset links cannot be generated for administrator accounts", 403);
  }
  if (user.role === "admin") {
    const { resetLink, expiresAt } = await userService.savePasswordResetTokenAndGetLink(
      req,
      employee,
      "manager.password_reset_link"
    );
    return {
      message: "Password reset link generated",
      data: {
        resetLink,
        expiresAt: expiresAt.toISOString(),
        userEmail: employee.email,
      },
    };
  }
  if (user.role === "manager") {
    if (employee.role !== "employee" || employee.managerId?.toString() !== user.id) {
      throw new AppError("This employee is not in your team", 403);
    }
    const { resetLink, expiresAt } = await userService.savePasswordResetTokenAndGetLink(
      req,
      employee,
      "manager.password_reset_link"
    );
    return {
      message: "Password reset link generated",
      data: {
        resetLink,
        expiresAt: expiresAt.toISOString(),
        userEmail: employee.email,
      },
    };
  }
  throw new AppError("Access denied", 403);
};

module.exports = {
  getAllEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeeById,
  getEmployeeAttendanceHistory,
  generateEmployeePasswordResetLink,
};
