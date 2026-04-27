// Attendance.js
// This file defines how Attendance is stored
// in the MongoDB database.
//
// An attendance record is created when an
// employee checks in to a shift.
// It tracks check in time, check out time,
// breaks taken and total hours worked.

const mongoose = require("mongoose");
const { Schema } = mongoose;

// workSessionSchema tracks one check-in and check-out pair.
// An employee may have multiple work sessions in one shift
// if they go on break (break ends a session, return starts a new one).
const workSessionSchema = new Schema(
  {
    // checkIn - the time this work session started
    checkIn: { type: Date, required: true },
    // checkOut - the time this work session ended
    // null if the employee is still checked in
    checkOut: { type: Date },
  },
  { _id: false }
);

// breakSessionSchema tracks one break taken during a shift
const breakSessionSchema = new Schema(
  {
    // start - the time this break started
    start: { type: Date, required: true },
    // end - the time this break ended
    // null if the employee is still on break
    end: { type: Date },
    // type - what kind of break this is
    // "lunch" or "short_break"
    type: { type: String, enum: ["lunch", "short_break"], default: "short_break" },
  },
  { _id: false }
);

// Main Attendance document - one per employee per shift
const attendanceSchema = new Schema(
  {
    // shift - which shift this attendance record belongs to
    shift: {
      type: Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
      index: true,
    },

    // employee - which employee this attendance record is for
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // status - the current state of this employee for this shift
    // not_started: employee has not checked in yet
    // checked_in: employee is currently working
    // on_break: employee is currently on a break
    // checked_out: employee has finished their shift
    status: {
      type: String,
      enum: ["not_started", "checked_in", "on_break", "checked_out"],
      default: "not_started",
      index: true,
    },

    // workSessions - array of all check-in/check-out pairs during this shift
    // each break creates a new work session when the employee returns
    workSessions: [workSessionSchema],

    // breaks - array of all breaks taken during this shift
    breaks: [breakSessionSchema],

    // totalWorkMinutes - total minutes the employee actually worked
    // calculated automatically from workSessions minus break time
    totalWorkMinutes: { type: Number, default: 0 },

    // totalBreakMinutes - total minutes spent on breaks
    // calculated automatically from breaks array
    totalBreakMinutes: { type: Number, default: 0 },

    // overtimeMinutes - minutes worked beyond the scheduled shift length
    overtimeMinutes: { type: Number, default: 0 },

    // isLate - true if employee checked in more than 10 minutes after shift started
    isLate: { type: Boolean, default: false },

    // lateByMins - how many minutes late the employee was
    lateByMins: { type: Number, default: 0 },

    // leftEarly - true if employee checked out before the shift ended
    leftEarly: { type: Boolean, default: false },

    // checkIn - the first time the employee checked in to this shift
    checkIn: { type: Date },

    // checkOut - the last time the employee checked out from this shift
    checkOut: { type: Date },

    // totalHours - total hours worked, formatted as a decimal
    // example: 7.5 means 7 hours and 30 minutes
    totalHours: { type: Number, default: 0 },

    // autoCheckout - true if the system automatically checked out the employee
    // happens when the employee forgets to check out after shift ends
    autoCheckout: { type: Boolean, default: false },

    // autoCheckoutAt - the time when auto checkout happened
    autoCheckoutAt: { type: Date, default: null },

    // notes - optional notes about this attendance record
    notes: { type: String, maxlength: 300 },
  },
  {
    timestamps: true,
  }
);

// Unique index: one employee can only have one attendance record per shift
attendanceSchema.index(
  { shift: 1, employee: 1 },
  { unique: true, name: "unique_shift_employee" }
);

// Speed up finding all attendance records for a shift with a specific status
attendanceSchema.index({ shift: 1, status: 1 }, { name: "shift_status" });

// Speed up getting all attendance history for one employee
attendanceSchema.index({ employee: 1, createdAt: -1 }, { name: "employee_history" });

// Speed up getting employee's attendance sorted by check-in time
attendanceSchema.index({ employee: 1, checkIn: -1 }, { name: "employee_checkin_history" });

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
