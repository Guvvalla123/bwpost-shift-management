// shiftController.js
// This file handles all shift operations.
// Managers use this to create and manage shifts.
//
// ROUTES THAT USE THIS CONTROLLER:
// GET    /api/manager/shifts
// POST   /api/manager/shifts
// GET    /api/manager/shifts/:shiftId
// PUT    /api/manager/shifts/:shiftId
// DELETE /api/manager/shifts/:shiftId
// GET    /api/manager/shifts/public
// GET    /api/manager/shifts/export/csv
// GET    /api/manager/shifts/shift-accepted-employees/:shiftId
// POST   /api/manager/shifts/shift/assign-employee
// POST   /api/manager/shifts/shift/remove-employee

const Shift = require("../models/Shift");
const ShiftRequest = require("../models/ShiftRequest");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/sendResponse");
const { log } = require("../helpers/auditLogger");
const { getPaginationParams, getPaginationMeta } = require("../helpers/pagination");
const { isBelowWeeklyLimit } = require("../helpers/calculateHours");
const {
  objectsToCsv,
  generateSafeFilename,
  setSecureCsvHeaders,
  filterAllowedFields,
  getAllowedFields,
  isRoleAllowedToExport,
} = require("../helpers/csvHelper");
// Import notification helper from notificationController
const { createBulkNotifications } = require("./notificationController");

// ─── PRIVATE HELPER ───────────────────────────────────────────────────────────

// assertManagerOwnsShift - throws 403 if a manager tries to access another manager's shift
const assertManagerOwnsShift = (user, shift) => {
  if (user.role === "manager" && shift.createdByManager.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }
};

// mergeShiftStartTimeRange - merges two date range objects without overwriting
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

// ─── ROUTE HANDLER FUNCTIONS ──────────────────────────────────────────────────

// getAllShiftsPublic - returns upcoming shifts with available slots
// Used by the employee-facing shift list (no manager filter)
exports.getAllShiftsPublic = asyncHandler(async (req, res) => {
  // Get pagination params from the query string
  const { page, limit, skip } = getPaginationParams(req.query, 20, 50);

  // Only show upcoming shifts that still have slots available
  const mongoQuery = {
    shiftStartTime: { $gte: new Date() },
    slotsAvailable: { $gt: 0 },
  };

  // Run both queries in parallel
  const [shifts, total] = await Promise.all([
    Shift.find(mongoQuery)
      .select("_id shiftTitle shiftStartTime shiftEndTime slotsAvailable shiftNotes")
      .sort({ shiftStartTime: 1 })
      .skip(skip)
      .limit(limit),
    Shift.countDocuments(mongoQuery),
  ]);

  return sendSuccess(res, 200, {
    message: "Upcoming shifts fetched successfully",
    data: shifts,
    pagination: getPaginationMeta(total, page, limit),
  });
});

// getAllShiftsManager - gets the paginated shift list for the manager dashboard
// Supports search, status filter, date range, and sort direction
exports.getAllShiftsManager = asyncHandler(async (req, res) => {
  const user = req.user;
  const query = req.query;

  // Get pagination params
  const { page, limit, skip } = getPaginationParams(query, 20, 50);

  // Default to "all" if status is empty or missing
  const status = query.status == null || query.status === "" ? "all" : query.status;
  const search = query.search == null || query.search === "" ? "" : String(query.search);

  const mongoQuery = {};

  // Managers can only see their own shifts
  if (user.role === "manager") mongoQuery.createdByManager = user.id;

  const now = new Date();

  // Apply status filter to determine which time range to query
  if (status === "upcoming") mongoQuery.shiftStartTime = { $gte: now };
  else if (status === "ongoing") {
    mongoQuery.shiftStartTime = { $lte: now };
    mongoQuery.shiftEndTime = { $gte: now };
  } else if (status === "completed" || status === "past") {
    mongoQuery.shiftEndTime = { $lt: now };
  }

  // Search by shift title if a search term is provided
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    mongoQuery.shiftTitle = { $regex: escaped, $options: "i" };
  }

  // Apply date range filter if provided
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

  // Sort ascending or descending based on query param
  const sortDir = query.sort === "asc" ? 1 : -1;

  // Run both queries in parallel
  const [shifts, total] = await Promise.all([
    Shift.find(mongoQuery)
      .populate("acceptedEmployees", "username email profileImage")
      .sort({ shiftStartTime: sortDir })
      .skip(skip)
      .limit(limit),
    Shift.countDocuments(mongoQuery),
  ]);

  return sendSuccess(res, 200, {
    message: "Shifts fetched successfully",
    data: shifts,
    pagination: getPaginationMeta(total, page, limit),
  });
});

// getShiftById - gets full details for one shift by its ID
// Manager can only view their own shifts
exports.getShiftById = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId } = req.params;

  // Find the shift with accepted employees populated
  const shift = await Shift.findById(shiftId)
    .populate("acceptedEmployees", "username email");
  if (!shift) throw new AppError("Shift not found", 404);

  // Verify manager ownership
  assertManagerOwnsShift(user, shift);

  return sendSuccess(res, 200, { data: shift });
});

// createShift - creates a new shift and notifies eligible employees
// After saving, notifies employees who are under the 40-hour weekly limit
exports.createShift = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftTitle, shiftStartTime, shiftEndTime, shiftNotes, slotsAvailable } = req.body;

  // Validate required fields (Joi schema already validated, this is a safety check)
  if (!shiftTitle || !shiftStartTime || !shiftEndTime || !slotsAvailable) {
    throw new AppError("Required fields are missing", 400);
  }

  // Create the shift in the database
  const shift = await Shift.create({
    shiftTitle,
    shiftStartTime,
    shiftEndTime,
    shiftNotes,
    slotsAvailable,
    createdByManager: user.id,
  });

  // Log the shift creation
  log("shift.create", req, "Shift", shift._id, { shiftTitle: shift.shiftTitle });

  // After responding, send notifications to eligible employees in the background
  // setImmediate means this runs after the HTTP response is sent (no delay for the user)
  setImmediate(() => {
    (async () => {
      try {
        // Find all active employees for this manager
        const employees = await User.find({
          role: "employee",
          managerId: user.id,
          isActive: true,
        })
          .select("_id")
          .lean();

        // Only notify employees who are below the 40-hour weekly limit
        const eligibleIds = [];
        for (const e of employees) {
          if (await isBelowWeeklyLimit(e._id, 40)) {
            eligibleIds.push(e._id);
          }
        }

        if (!eligibleIds.length) {
          console.log(
            "[shift.notify] No eligible employees below weekly hour limit for new shift",
            shift._id.toString()
          );
          return;
        }

        // Format the shift start date for the notification message
        const startStr = new Date(shift.shiftStartTime).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        });
        const msg = `A new shift ${shift.shiftTitle} on ${startStr} is available for you`;

        // Send a notification to every eligible employee
        await createBulkNotifications(
          eligibleIds,
          "new_shift",
          "New shift available",
          msg,
          shift._id
        );
      } catch (err) {
        console.error("[shift.notify] Failed:", err.message);
      }
    })();
  });

  return sendSuccess(res, 201, { message: "Shift created successfully", data: shift });
});

// updateShift - updates an existing shift's details
// Manager can only update their own shifts
exports.updateShift = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId } = req.params;
  const body = req.body;

  // Find the shift
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);

  // Verify manager ownership
  assertManagerOwnsShift(user, shift);

  // Only allow updating these specific fields
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

  return sendSuccess(res, 200, { message: "Shift updated successfully", data: shift });
});

// deleteShift - permanently deletes a shift
// Also cancels any pending requests that reference this shift
exports.deleteShift = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId } = req.params;

  // Find the shift
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);

  // Verify manager ownership
  assertManagerOwnsShift(user, shift);

  const now = new Date();

  // Cancel any pending requests that involve this shift
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

  // Log the deletion
  log("shift.delete", req, "Shift", shift._id, { shiftTitle: shift.shiftTitle, deletedBy: user.id });

  // Delete the shift
  await shift.deleteOne();

  // Log if any requests were cancelled as a side effect
  if (cancelResult.modifiedCount > 0) {
    log("SHIFT_DELETED_REQUESTS_CANCELLED", req, "ShiftRequest", shift._id, {
      cancelledRequests: cancelResult.modifiedCount,
      shiftId: shift._id.toString(),
      reason: "Shift deleted",
      deletedBy: user.id,
    });
  }

  return sendSuccess(res, 200, { message: "Shift deleted successfully" });
});

// getShiftAcceptedEmployees - gets the list of employees assigned to one shift
// Manager can only view their own shifts
exports.getShiftAcceptedEmployees = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId } = req.params;

  // Find the shift with employee details
  const shift = await Shift.findById(shiftId).populate("acceptedEmployees", "username email");
  if (!shift) throw new AppError("Shift not found", 404);

  // Only the manager who created this shift can see it
  if (shift.createdByManager.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }

  return sendSuccess(res, 200, { data: shift.acceptedEmployees });
});

// assignEmployeeToShift - manager assigns an employee to a shift
// Checks for time conflicts and available slots before assigning
exports.assignEmployeeToShift = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId, employeeId } = req.body;

  if (!shiftId || !employeeId) throw new AppError("shiftId and employeeId are required", 400);

  // Verify the employee exists and has the right role
  const employee = await User.findById(employeeId);
  if (!employee) throw new AppError("Employee not found", 404);
  if (employee.role !== "employee") throw new AppError("User is not an employee", 400);

  // Manager can only assign employees from their own team
  if (user.role === "manager" && employee.managerId?.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }

  // Check for time conflicts with other shifts this employee is already on
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

  // Add the employee to the shift atomically (prevents race conditions)
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

  // If the update failed, find out why
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

  return sendSuccess(res, 200, { message: "Employee assigned to shift successfully" });
});

// removeEmployeeFromShift - manager removes an employee from a shift
// Also deletes their attendance record for that shift
exports.removeEmployeeFromShift = asyncHandler(async (req, res) => {
  const user = req.user;
  const { shiftId, employeeId } = req.body;

  if (!shiftId || !employeeId) throw new AppError("shiftId and employeeId are required", 400);

  // Find the shift
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);

  // Manager can only remove employees from their own shifts
  if (user.role === "manager" && shift.createdByManager.toString() !== user.id) {
    throw new AppError("Access denied", 403);
  }

  // Remove the employee and free up the slot
  shift.acceptedEmployees = shift.acceptedEmployees.filter((id) => id.toString() !== employeeId);
  shift.slotsAvailable += 1;
  await shift.save();

  log("shift.remove_employee", req, "Shift", shift._id, { employeeId, shiftTitle: shift.shiftTitle });

  // Also clean up their attendance record for this shift
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

  return sendSuccess(res, 200, { message: "Employee removed from shift successfully" });
});

// exportShiftsCsv - exports shift data as a downloadable CSV file
// Only admins and managers with the correct role can export
exports.exportShiftsCsv = asyncHandler(async (req, res) => {
  const { role, id: userId } = req.user;

  // Check that this role is allowed to export shift data
  if (!isRoleAllowedToExport(role, "shifts")) {
    throw new AppError("You do not have permission to export data", 403);
  }

  // Get the list of allowed fields for this role
  const allowedFields = getAllowedFields(role, "shifts");
  if (!allowedFields.length) {
    throw new AppError("You do not have permission to export data", 403);
  }

  // Managers can only export their own shifts
  const query = role === "manager" ? { createdByManager: userId } : {};

  // Fetch the shifts from the database
  const shifts = await Shift.find(query)
    .select(allowedFields.join(" "))
    .lean();

  // Remove any fields the role is not allowed to see
  const filteredShifts = shifts.map((shift) =>
    filterAllowedFields(shift, allowedFields)
  );

  // Generate a safe filename and set the CSV response headers
  const filename = generateSafeFilename("shifts-report");
  setSecureCsvHeaders(res, filename);

  // Convert the data to CSV format
  const csv = objectsToCsv(allowedFields, filteredShifts);

  // Log the export in the audit trail
  log(
    "csv.export.shifts",
    req,
    "Shift",
    null,
    {
      recordCount: filteredShifts.length,
      filename,
      allowedFields,
      exportedAt: new Date().toISOString(),
    }
  );

  return res.status(200).send(csv);
});
