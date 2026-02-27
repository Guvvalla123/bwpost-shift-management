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
    if (status === "upcoming") {
      query.shiftStartTime = { $gte: new Date() };
    }

    if (status === "past") {
      query.shiftStartTime = { $lt: new Date() };
    }

    // SEARCH FILTER
    if (search) {
      query.shiftTitle = { $regex: search, $options: "i" };
    }

    const skip = (page - 1) * limit;

    const shifts = await Shift.find(query)
      .populate("acceptedEmployees", "username email")
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
    const employees = await User.find({ role: "employee" })
      .select("username email");

    res.status(200).json({
      status: "Y",
      data: employees,
    });
  } catch (error) {
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

    // Check if employee is in acceptedEmployees
    if (!shift.acceptedEmployees.includes(employeeId)) {
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

    // Use provided timestamp (manual/biometric) or fall back to current time
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
    });

    await shift.save();

    res.status(200).json({
      status: "Y",
      message: "Check-in recorded successfully",
      data: { checkInTime },
    });
  } catch (error) {
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

    // Use provided timestamp (manual/biometric) or fall back to current time
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

    const allowedUpdates = ["username", "email", "role"];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "role" && !["manager", "employee"].includes(req.body[field])) {
          return;
        }
        employee[field] = req.body[field];
      }
    });

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

    const shift = await Shift.findById(shiftId);
    const employee = await User.findById(employeeId);

    if (!shift) {
      return res.status(404).json({
        status: "N",
        error: "Shift not found",
      });
    }

    if (!employee) {
      return res.status(404).json({
        status: "N",
        error: "Employee not found",
      });
    }

    if (shift.createdByManager.toString() !== req.user.id) {
      return res.status(403).json({
        status: "N",
        error: "Access denied",
      });
    }

    if (employee.role !== "employee") {
      return res.status(400).json({
        status: "N",
        error: "User is not an employee",
      });
    }

    // Check if already assigned
    if (shift.acceptedEmployees.includes(employeeId)) {
      return res.status(400).json({
        status: "N",
        error: "Employee already assigned to this shift",
      });
    }

    // Check slots availability
    if (shift.slotsAvailable <= 0) {
      return res.status(400).json({
        status: "N",
        error: "No slots available for this shift",
      });
    }

    shift.acceptedEmployees.push(employeeId);
    shift.slotsAvailable -= 1;

    await shift.save();

    res.status(200).json({
      status: "Y",
      message: "Employee assigned to shift successfully",
    });
  } catch (error) {
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
    const { startDate, endDate } = req.query;

    const employee = await User.findById(employeeId);

    if (!employee) {
      return res.status(404).json({
        status: "N",
        error: "Employee not found",
      });
    }

    // Build query for shifts where employee is accepted
    const query = {
      acceptedEmployees: employeeId,
      "attendance.employee": employeeId,
    };

    if (startDate || endDate) {
      query.shiftStartTime = {};
      if (startDate) query.shiftStartTime.$gte = new Date(startDate);
      if (endDate) query.shiftStartTime.$lte = new Date(endDate);
    }

    const shifts = await Shift.find(query)
      .select("shiftTitle shiftStartTime shiftEndTime attendance")
      .populate("createdByManager", "username")
      .sort({ shiftStartTime: -1 });

    // Extract attendance records for this employee
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
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "N",
      error: error.message,
    });
  }
};
