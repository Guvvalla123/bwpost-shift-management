const Shift = require("../models/shiftModel");
const User = require("../models/userModel");

/* ============================================================
   PUBLIC - GET UPCOMING SHIFTS
============================================================ */
exports.getAllShiftsPublic = async (req, res) => {
  try {
    const today = new Date();

    const shifts = await Shift.find({
      shiftStartTime: { $gte: today },
      slotsAvailable: { $gt: 0 },
    })
      .select("shiftTitle shiftStartTime shiftEndTime slotsAvailable shiftNotes")
      .populate("createdByManager", "username")
      .sort({ shiftStartTime: 1 });

    res.status(200).json({
      status: "Y",
      message: "Upcoming shifts fetched successfully",
      data: shifts,
    });
  } catch (error) {
    console.error("getAllShiftsPublic:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - CREATE SHIFT
============================================================ */
exports.createShift = async (req, res) => {
  try {
    const {
      shiftTitle,
      shiftStartTime,
      shiftEndTime,
      shiftNotes,
      slotsAvailable,
    } = req.body;

    if (!shiftTitle || !shiftStartTime || !shiftEndTime || !slotsAvailable) {
      return res.status(400).json({
        status: "N",
        error: "Required fields are missing",
      });
    }

    const shift = await Shift.create({
      shiftTitle,
      shiftStartTime,
      shiftEndTime,
      shiftNotes,
      slotsAvailable,
      createdByManager: req.user.id,
    });

    res.status(201).json({
      status: "Y",
      message: "Shift created successfully",
      data: shift,
    });
  } catch (error) {
    console.error("createShift:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - GET SHIFTS (PAGINATION + FILTER + SEARCH)
============================================================ */
exports.getAllShiftsManager = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = "all", search = "" } = req.query;

    const query = {
      createdByManager: req.user.id,
    };

    // STATUS FILTER
    const now = new Date();
    if (status === "upcoming") {
      query.shiftStartTime = { $gte: now };
    } else if (status === "ongoing") {
      query.shiftStartTime = { $lte: now };
      query.shiftEndTime = { $gte: now };
    } else if (status === "completed" || status === "past") {
      query.shiftEndTime = { $lt: now };
    }

    // SEARCH FILTER (escape special regex chars to prevent ReDoS)
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.shiftTitle = { $regex: escaped, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const shifts = await Shift.find(query)
      .populate("acceptedEmployees", "username email profileImage")

      .populate("attendance.employee", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Shift.countDocuments(query);

    res.status(200).json({
      status: "Y",
      message: "Shifts fetched successfully",
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      data: shifts,
    });
  } catch (error) {
    console.error("getAllShiftsManager:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - GET SHIFT BY ID
============================================================ */
exports.getShiftById = async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findById(shiftId)
      .populate("acceptedEmployees", "username email")
      .populate("attendance.employee", "username email");

    if (!shift) {
      return res.status(404).json({
        status: "N",
        error: "Shift not found",
      });
    }

    if (shift.createdByManager.toString() !== req.user.id) {
      return res.status(403).json({
        status: "N",
        error: "Access denied",
      });
    }

    res.status(200).json({
      status: "Y",
      data: shift,
    });
  } catch (error) {
    console.error("getShiftById:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - UPDATE SHIFT
============================================================ */
exports.updateShift = async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return res.status(404).json({
        status: "N",
        error: "Shift not found",
      });
    }

    if (shift.createdByManager.toString() !== req.user.id) {
      return res.status(403).json({
        status: "N",
        error: "Access denied",
      });
    }

    const allowedUpdates = [
      "shiftTitle",
      "shiftStartTime",
      "shiftEndTime",
      "shiftNotes",
      "slotsAvailable",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        shift[field] = req.body[field];
      }
    });

    await shift.save();

    res.status(200).json({
      status: "Y",
      message: "Shift updated successfully",
      data: shift,
    });
  } catch (error) {
    console.error("updateShift:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - DELETE SHIFT
============================================================ */
exports.deleteShift = async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return res.status(404).json({
        status: "N",
        error: "Shift not found",
      });
    }

    if (shift.createdByManager.toString() !== req.user.id) {
      return res.status(403).json({
        status: "N",
        error: "Access denied",
      });
    }

    await shift.deleteOne();

    res.status(200).json({
      status: "Y",
      message: "Shift deleted successfully",
    });
  } catch (error) {
    console.error("deleteShift:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - GET ALL EMPLOYEES
============================================================ */
exports.getAllEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 50, search = "" } = req.query;
    const skip = (page - 1) * limit;
    const query = { role: "employee" };

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { username: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } },
      ];
    }

    const [employees, total] = await Promise.all([
      User.find(query).select("username email").skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      status: "Y",
      data: employees,
      total, page: Number(page), pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("getAllEmployees:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - GET ACCEPTED EMPLOYEES FOR SHIFT
============================================================ */
exports.getShiftAcceptedEmployees = async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findById(shiftId)
      .populate("acceptedEmployees", "username email");

    if (!shift) {
      return res.status(404).json({
        status: "N",
        error: "Shift not found",
      });
    }

    if (shift.createdByManager.toString() !== req.user.id) {
      return res.status(403).json({
        status: "N",
        error: "Access denied",
      });
    }

    res.status(200).json({
      status: "Y",
      data: shift.acceptedEmployees,
    });
  } catch (error) {
    console.error("getShiftAcceptedEmployees:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - MARK EMPLOYEE CHECK-IN
============================================================ */
exports.markCheckIn = async (req, res) => {
  try {
    const { shiftId, employeeId, checkInTime: customCheckIn } = req.body;

    if (!shiftId || !employeeId) {
      return res.status(400).json({
        status: "N",
        error: "shiftId and employeeId are required",
      });
    }

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return res.status(404).json({
        status: "N",
        error: "Shift not found",
      });
    }

    if (shift.createdByManager.toString() !== req.user.id) {
      return res.status(403).json({
        status: "N",
        error: "Access denied",
      });
    }

    if (!shift.acceptedEmployees.some(id => id.toString() === employeeId)) {
      return res.status(400).json({
        status: "N",
        error: "Employee has not accepted this shift",
      });
    }

    // Check if already checked in (and not checked out)
    const existingAttendance = shift.attendance.find(
      (att) => att.employee.toString() === employeeId &&
        (!att.checkOut || att.checkOut.getTime() === att.checkIn.getTime())
    );

    if (existingAttendance) {
      return res.status(400).json({
        status: "N",
        error: "Employee already checked in",
      });
    }

    // Manual check-in only (no fingerprint/biometric). Use provided timestamp or current time.
    const checkInTime = customCheckIn ? new Date(customCheckIn) : new Date();

    if (isNaN(checkInTime.getTime())) {
      return res.status(400).json({
        status: "N",
        error: "Invalid checkInTime provided",
      });
    }

    shift.attendance.push({
      employee: employeeId,
      checkIn: checkInTime,
      checkOut: checkInTime, // Set same as check-in initially, updated on check-out
      totalHours: 0,
      status: "checked_in", // Required for dashboard aggregation
    });

    await shift.save();

    res.status(200).json({
      status: "Y",
      message: "Check-in recorded successfully",
      data: { checkInTime },
    });
  } catch (error) {
    console.error("markCheckIn:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - MARK EMPLOYEE CHECK-OUT
============================================================ */
exports.markCheckOut = async (req, res) => {
  try {
    const { shiftId, employeeId, checkOutTime: customCheckOut } = req.body;

    if (!shiftId || !employeeId) {
      return res.status(400).json({
        status: "N",
        error: "shiftId and employeeId are required",
      });
    }

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return res.status(404).json({
        status: "N",
        error: "Shift not found",
      });
    }

    if (shift.createdByManager.toString() !== req.user.id) {
      return res.status(403).json({
        status: "N",
        error: "Access denied",
      });
    }

    // Find attendance record (check-in exists but check-out hasn't been set properly)
    const attendanceRecord = shift.attendance.find(
      (att) => att.employee.toString() === employeeId &&
        (!att.checkOut || att.checkOut.getTime() === att.checkIn.getTime())
    );

    if (!attendanceRecord) {
      return res.status(400).json({
        status: "N",
        error: "Employee has not checked in",
      });
    }

    // Manual check-out only (no fingerprint/biometric). Use provided timestamp or current time.
    const checkOutTime = customCheckOut ? new Date(customCheckOut) : new Date();

    if (isNaN(checkOutTime.getTime())) {
      return res.status(400).json({
        status: "N",
        error: "Invalid checkOutTime provided",
      });
    }

    const checkInTime = new Date(attendanceRecord.checkIn);

    if (checkOutTime <= checkInTime) {
      return res.status(400).json({
        status: "N",
        error: "Check-out time must be after check-in time",
      });
    }

    attendanceRecord.checkOut = checkOutTime;
    attendanceRecord.status = "checked_out"; // Required for dashboard aggregation
    const hoursWorked = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    attendanceRecord.totalHours = Math.round(hoursWorked * 100) / 100;

    await shift.save();

    res.status(200).json({
      status: "Y",
      message: "Check-out recorded successfully",
      data: {
        totalHours: attendanceRecord.totalHours,
        checkOutTime,
      },
    });
  } catch (error) {
    console.error("markCheckOut:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - GET SHIFT ATTENDANCE
============================================================ */
exports.getShiftAttendance = async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await Shift.findById(shiftId)
      .populate("attendance.employee", "username email")
      .populate("acceptedEmployees", "username email");

    if (!shift) {
      return res.status(404).json({
        status: "N",
        error: "Shift not found",
      });
    }

    if (shift.createdByManager.toString() !== req.user.id) {
      return res.status(403).json({
        status: "N",
        error: "Access denied",
      });
    }

    res.status(200).json({
      status: "Y",
      data: {
        attendance: shift.attendance,
        acceptedEmployees: shift.acceptedEmployees,
      },
    });
  } catch (error) {
    console.error("getShiftAttendance:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - CREATE EMPLOYEE
============================================================ */
exports.createEmployee = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        status: "N",
        error: "Username, email, and password are required",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        status: "N",
        error: "User with this email already exists",
      });
    }

    const employee = await User.create({
      username,
      email: email.toLowerCase(),
      password,
      role: "employee",
    });

    res.status(201).json({
      status: "Y",
      message: "Employee created successfully",
      data: {
        _id: employee._id,
        username: employee.username,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error("createEmployee:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - UPDATE EMPLOYEE
============================================================ */
exports.updateEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { username, email, role } = req.body;

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        status: "N",
        error: "Employee not found",
      });
    }

    // Prevent changing own role or deleting self
    if (employeeId === req.user.id) {
      return res.status(400).json({
        status: "N",
        error: "Cannot modify your own account",
      });
    }

    // Only username and email updatable; role changes require admin (not implemented)
    const allowedUpdates = ["username", "email"];
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        employee[field] = req.body[field];
      }
    }

    await employee.save();

    res.status(200).json({
      status: "Y",
      message: "Employee updated successfully",
      data: {
        _id: employee._id,
        username: employee.username,
        email: employee.email,
        role: employee.role,
      },
    });
  } catch (error) {
    console.error("updateEmployee:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - DELETE EMPLOYEE
============================================================ */
exports.deleteEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        status: "N",
        error: "Employee not found",
      });
    }

    // Prevent deleting self
    if (employeeId === req.user.id) {
      return res.status(400).json({
        status: "N",
        error: "Cannot delete your own account",
      });
    }

    // Remove employee from all shifts
    await Shift.updateMany(
      { acceptedEmployees: employeeId },
      { $pull: { acceptedEmployees: employeeId } }
    );

    await employee.deleteOne();

    res.status(200).json({
      status: "Y",
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("deleteEmployee:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - GET EMPLOYEE BY ID
============================================================ */
exports.getEmployeeById = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const employee = await User.findById(employeeId).select("username email role createdAt");

    if (!employee) {
      return res.status(404).json({
        status: "N",
        error: "Employee not found",
      });
    }

    res.status(200).json({
      status: "Y",
      data: employee,
    });
  } catch (error) {
    console.error("getEmployeeById:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - REMOVE EMPLOYEE FROM SHIFT
============================================================ */
exports.removeEmployeeFromShift = async (req, res) => {
  try {
    const { shiftId, employeeId } = req.body;

    if (!shiftId || !employeeId) {
      return res.status(400).json({
        status: "N",
        error: "shiftId and employeeId are required",
      });
    }

    const shift = await Shift.findById(shiftId);

    if (!shift) {
      return res.status(404).json({
        status: "N",
        error: "Shift not found",
      });
    }

    if (shift.createdByManager.toString() !== req.user.id) {
      return res.status(403).json({
        status: "N",
        error: "Access denied",
      });
    }

    // Remove from acceptedEmployees
    shift.acceptedEmployees = shift.acceptedEmployees.filter(
      (id) => id.toString() !== employeeId
    );

    // Increase available slots
    shift.slotsAvailable += 1;

    // Remove attendance records if any
    shift.attendance = shift.attendance.filter(
      (att) => att.employee.toString() !== employeeId
    );

    await shift.save();

    res.status(200).json({
      status: "Y",
      message: "Employee removed from shift successfully",
    });
  } catch (error) {
    console.error("removeEmployeeFromShift:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - ASSIGN EMPLOYEE TO SHIFT
============================================================ */
exports.assignEmployeeToShift = async (req, res) => {
  try {
    const { shiftId, employeeId } = req.body;

    if (!shiftId || !employeeId) {
      return res.status(400).json({
        status: "N",
        error: "shiftId and employeeId are required",
      });
    }

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        status: "N",
        error: "Employee not found",
      });
    }

    if (employee.role !== "employee") {
      return res.status(400).json({
        status: "N",
        error: "User is not an employee",
      });
    }

    const shift = await Shift.findOneAndUpdate(
      {
        _id: shiftId,
        createdByManager: req.user.id,
        slotsAvailable: { $gt: 0 },
        acceptedEmployees: { $ne: employeeId },
      },
      {
        $push: { acceptedEmployees: employeeId },
        $inc: { slotsAvailable: -1 },
      },
      { new: true }
    );

    if (!shift) {
      const existing = await Shift.findById(shiftId);
      if (!existing) return res.status(404).json({ status: "N", error: "Shift not found" });
      if (existing.createdByManager.toString() !== req.user.id)
        return res.status(403).json({ status: "N", error: "Access denied" });
      if (existing.acceptedEmployees.some(id => id.toString() === employeeId))
        return res.status(400).json({ status: "N", error: "Employee already assigned to this shift" });
      return res.status(400).json({ status: "N", error: "No slots available for this shift" });
    }

    res.status(200).json({
      status: "Y",
      message: "Employee assigned to shift successfully",
    });
  } catch (error) {
    console.error("assignEmployeeToShift:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};


/* ============================================================
   MANAGER - GET EMPLOYEE ATTENDANCE HISTORY
============================================================ */
exports.getEmployeeAttendanceHistory = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { startDate, endDate, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        status: "N",
        error: "Employee not found",
      });
    }

    // Shifts where this employee has attendance records (attendance.employee is source of truth)
    const query = { "attendance.employee": employeeId };

    if (startDate || endDate) {
      query.shiftStartTime = {};
      if (startDate) query.shiftStartTime.$gte = new Date(startDate);
      if (endDate) query.shiftStartTime.$lte = new Date(endDate);
    }

    const [shifts, total] = await Promise.all([
      Shift.find(query)
        .select("shiftTitle shiftStartTime shiftEndTime attendance")
        .populate("createdByManager", "username")
        .sort({ shiftStartTime: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Shift.countDocuments(query),
    ]);

    const attendanceHistory = shifts
      .map((shift) => {
        const attendance = shift.attendance.find(
          (att) => att.employee.toString() === employeeId
        );
        if (attendance) {
          return {
            shiftId: shift._id,
            shiftTitle: shift.shiftTitle,
            shiftDate: shift.shiftStartTime,
            checkIn: attendance.checkIn,
            checkOut: attendance.checkOut,
            totalHours: attendance.totalHours,
          };
        }
        return null;
      })
      .filter((item) => item !== null);

    res.status(200).json({
      status: "Y",
      data: {
        employee: {
          _id: employee._id,
          username: employee.username,
          email: employee.email,
        },
        attendanceHistory,
        total, page: Number(page), pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getEmployeeAttendanceHistory:", error);
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};
