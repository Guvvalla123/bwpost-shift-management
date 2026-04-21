const Shift = require("../models/shiftModel");
const Attendance = require("../models/attendanceModel");
const AppError = require("../utils/AppError");
const { log } = require("../utils/auditLog");

const recalc = (att, shiftStart, shiftEnd) => {
  const now = new Date();
  let workMins = att.workSessions.reduce((sum, ws) => {
    if (!ws.checkOut) return sum;
    return sum + (ws.checkOut - ws.checkIn) / 60000;
  }, 0);
  const openWork = att.workSessions.find((ws) => !ws.checkOut);
  if (openWork) workMins += (now - openWork.checkIn) / 60000;

  let breakMins = att.breaks.reduce((sum, b) => {
    if (!b.end) return sum;
    return sum + (b.end - b.start) / 60000;
  }, 0);
  const openBreak = att.breaks.find((b) => !b.end);
  if (openBreak) breakMins += (now - openBreak.start) / 60000;

  const scheduledMins = shiftEnd
    ? Math.max(0, (new Date(shiftEnd) - new Date(shiftStart)) / 60000)
    : 0;
  const netWorkMins = Math.max(0, workMins - breakMins);
  const overtimeMins = Math.max(0, netWorkMins - scheduledMins);

  att.totalWorkMinutes = Math.round(netWorkMins);
  att.totalBreakMinutes = Math.round(breakMins);
  att.overtimeMinutes = Math.round(overtimeMins);
  att.totalHours = +(netWorkMins / 60).toFixed(2);
};

const getOrCreateAttendance = async (shiftId, employeeId) => {
  let record = await Attendance.findOne({ shift: shiftId, employee: employeeId });
  if (!record) {
    record = new Attendance({
      shift: shiftId,
      employee: employeeId,
      status: "not_started",
      workSessions: [],
      breaks: [],
    });
  }
  return record;
};

const checkIn = async (req, user, { shiftId, employeeId }) => {
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role !== "manager" &&
    user.role !== "admin"
  ) {
    throw new AppError("Only managers or admins can check in other employees", 403);
  }
  const targetId = employeeId || user.id;
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role === "manager" &&
    shift.createdByManager?.toString() !== user.id
  ) {
    throw new AppError("Access denied", 403);
  }
  if (!shift.acceptedEmployees.some((id) => id.toString() === targetId.toString())) {
    throw new AppError("Employee is not assigned to this shift", 403);
  }
  const att = await getOrCreateAttendance(shiftId, targetId);
  if (att.status === "checked_out") throw new AppError("Shift already completed", 400);
  if (att.status === "checked_in") {
    throw new AppError("Already checked in — check out first or take a break", 400);
  }
  const now = new Date();
  const shiftStart = new Date(shift.shiftStartTime);
  const minsLate = Math.floor((now - shiftStart) / 60000);
  if (att.workSessions.length === 0 && minsLate > 10) {
    att.isLate = true;
    att.lateByMins = minsLate;
  }
  att.workSessions.push({ checkIn: now });
  att.status = "checked_in";
  att.checkIn = att.checkIn || now;
  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  await att.save();
  log("attendance.checkin", req, "Shift", shiftId, {
    employeeId: targetId,
    shiftId,
    time: new Date(),
  });
  return { message: "Checked in successfully", data: att };
};

const checkOut = async (req, user, { shiftId, employeeId, notes }) => {
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role !== "manager" &&
    user.role !== "admin"
  ) {
    throw new AppError("Only managers or admins can check out other employees", 403);
  }
  const targetId = employeeId || user.id;
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role === "manager" &&
    shift.createdByManager?.toString() !== user.id
  ) {
    throw new AppError("Access denied", 403);
  }
  const att = await Attendance.findOne({ shift: shiftId, employee: targetId });
  if (!att) throw new AppError("No attendance record found — check in first", 400);
  if (att.status === "checked_out") throw new AppError("Already checked out", 400);
  if (att.status === "on_break") throw new AppError("End break before checking out", 400);
  if (att.status !== "checked_in") throw new AppError("Not currently checked in", 400);

  const now = new Date();
  const openWork = [...att.workSessions].reverse().find((ws) => !ws.checkOut);
  if (openWork) openWork.checkOut = now;
  const shiftEnd = new Date(shift.shiftEndTime);
  if (now < shiftEnd) att.leftEarly = true;
  att.status = "checked_out";
  att.checkOut = now;
  if (notes) att.notes = notes;
  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  await att.save();
  log("attendance.checkout", req, "Shift", shiftId, {
    employeeId: targetId,
    shiftId,
    time: new Date(),
  });
  return { message: "Checked out successfully", data: att };
};

const startBreak = async (req, user, { shiftId, type = "short_break", employeeId }) => {
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role !== "manager" &&
    user.role !== "admin"
  ) {
    throw new AppError("Only managers or admins can start breaks for other employees", 403);
  }
  const targetId = employeeId || user.id;
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role === "manager" &&
    shift.createdByManager?.toString() !== user.id
  ) {
    throw new AppError("Access denied", 403);
  }
  const att = await Attendance.findOne({ shift: shiftId, employee: targetId });
  if (!att || att.status !== "checked_in") {
    throw new AppError("Must be checked in to start a break", 400);
  }
  if (att.breaks.some((b) => !b.end)) throw new AppError("Already on a break", 400);
  const now = new Date();
  const openWork = [...att.workSessions].reverse().find((ws) => !ws.checkOut);
  if (openWork) openWork.checkOut = now;
  att.breaks.push({ start: now, type });
  att.status = "on_break";
  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  await att.save();
  log("attendance.break.start", req, "Shift", shiftId, {
    employeeId: targetId,
    shiftId,
    time: new Date(),
  });
  return { message: "Break started", data: att };
};

const endBreak = async (req, user, { shiftId, employeeId }) => {
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role !== "manager" &&
    user.role !== "admin"
  ) {
    throw new AppError("Only managers or admins can end breaks for other employees", 403);
  }
  const targetId = employeeId || user.id;
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);
  if (
    employeeId &&
    employeeId !== user.id &&
    user.role === "manager" &&
    shift.createdByManager?.toString() !== user.id
  ) {
    throw new AppError("Access denied", 403);
  }
  const att = await Attendance.findOne({ shift: shiftId, employee: targetId });
  if (!att || att.status !== "on_break") throw new AppError("Not currently on break", 400);
  const now = new Date();
  const openBreak = [...att.breaks].reverse().find((b) => !b.end);
  if (openBreak) openBreak.end = now;
  att.workSessions.push({ checkIn: now });
  att.status = "checked_in";
  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  await att.save();
  log("attendance.break.end", req, "Shift", shiftId, {
    employeeId: targetId,
    shiftId,
    time: new Date(),
  });
  return { message: "Break ended — back to work", data: att };
};

const getShiftAttendance = async (user, shiftId) => {
  const shift = await Shift.findById(shiftId)
    .populate("acceptedEmployees", "username email profileImage")
    .populate("createdByManager", "username email");
  if (!shift) throw new AppError("Shift not found", 404);
  const managerId =
    shift.createdByManager?._id?.toString() || shift.createdByManager?.toString?.();
  if (user.role === "manager" && managerId !== user.id) {
    throw new AppError("Access denied", 403);
  }
  const attendanceDocs = await Attendance.find({ shift: shiftId }).populate(
    "employee",
    "username email profileImage"
  );
  const byEmployeeId = new Map();
  attendanceDocs.forEach((doc) => {
    const eid = doc.employee?._id?.toString() || doc.employee?.toString?.();
    if (eid) byEmployeeId.set(eid, doc);
  });
  const records = shift.acceptedEmployees.map((emp) => {
    const att = byEmployeeId.get(emp._id.toString());
    if (att) {
      recalc(att, shift.shiftStartTime, shift.shiftEndTime);
      const plain = att.toObject ? att.toObject() : att;
      return { ...plain, employee: emp };
    }
    return {
      employee: emp,
      status: "not_started",
      workSessions: [],
      breaks: [],
      totalWorkMinutes: 0,
      totalBreakMinutes: 0,
      isLate: false,
      lateByMins: 0,
      leftEarly: false,
    };
  });
  const manager = shift.createdByManager;
  const shiftData = {
    _id: shift._id,
    shiftTitle: shift.shiftTitle,
    shiftStartTime: shift.shiftStartTime,
    shiftEndTime: shift.shiftEndTime,
    shiftNotes: shift.shiftNotes || null,
    createdAt: shift.createdAt,
    slotsAvailable: shift.slotsAvailable,
    manager: manager
      ? { _id: manager._id, username: manager.username, email: manager.email }
      : null,
  };
  return { shift: shiftData, attendance: records };
};

const getMyAttendance = async (userId, shiftId) => {
  const shift = await Shift.findById(shiftId);
  if (!shift) throw new AppError("Shift not found", 404);
  const att = await Attendance.findOne({ shift: shiftId, employee: userId });
  if (!att) {
    return {
      shift: {
        _id: shift._id,
        shiftTitle: shift.shiftTitle,
        shiftStartTime: shift.shiftStartTime,
        shiftEndTime: shift.shiftEndTime,
      },
      attendance: {
        status: "not_started",
        workSessions: [],
        breaks: [],
        totalWorkMinutes: 0,
        totalBreakMinutes: 0,
      },
    };
  }
  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  return {
    shift: {
      _id: shift._id,
      shiftTitle: shift.shiftTitle,
      shiftStartTime: shift.shiftStartTime,
      shiftEndTime: shift.shiftEndTime,
    },
    attendance: att,
  };
};

/**
 * System auto-checkout at shift end (cron). Idempotent if autoCheckout already true.
 */
const autoCheckoutAttendanceRecord = async (att, shift) => {
  if (att.autoCheckout) return { skipped: true };
  if (att.status !== "checked_in") return { skipped: true };
  const shiftEnd = new Date(shift.shiftEndTime);
  const openWork = [...att.workSessions].reverse().find((ws) => !ws.checkOut);
  if (openWork) openWork.checkOut = shiftEnd;
  att.status = "checked_out";
  att.checkOut = shiftEnd;
  att.autoCheckout = true;
  att.autoCheckoutAt = new Date();
  att.leftEarly = false;
  recalc(att, shift.shiftStartTime, shift.shiftEndTime);
  await att.save();
  log(
    "attendance.auto_checkout",
    { ip: "cron", get: () => "" },
    "Shift",
    shift._id,
    { employeeId: att.employee, shiftId: shift._id },
    { actorId: att.employee, actorRole: "employee" }
  );
  return { skipped: false };
};

module.exports = {
  checkIn,
  checkOut,
  startBreak,
  endBreak,
  getShiftAttendance,
  getMyAttendance,
  recalc,
  autoCheckoutAttendanceRecord,
};
