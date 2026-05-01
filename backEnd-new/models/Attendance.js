// Attendance.js
// This is the Attendance model.
// One record is created when an employee
// checks in to a shift.
// It tracks check in time, check out time,
// breaks, and total minutes worked.

const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    // shift - which shift this record is for
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },
    // employee - which employee this belongs to
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // status - current state of this attendance
    // not_started: not checked in yet
    // checked_in: currently working
    // on_break: currently on break
    // checked_out: done for the day
    status: {
      type: String,
      enum: ["not_started", "checked_in", "on_break", "checked_out"],
      default: "not_started",
    },
    // checkIn - the exact time they checked in
    checkIn: {
      type: Date,
    },
    // checkOut - the exact time they checked out
    checkOut: {
      type: Date,
    },
    // breaks - list of all breaks taken
    breaks: [
      {
        // start - when this break started
        start: { type: Date },
        // end - when this break ended
        end: { type: Date },
        // type - short_break or lunch
        type: {
          type: String,
          enum: ["short_break", "lunch"],
        },
      },
    ],
    // totalWorkMinutes - total minutes worked
    // this is calculated when they check out
    totalWorkMinutes: {
      type: Number,
      default: 0,
    },
    // isLate - true if they checked in late
    isLate: {
      type: Boolean,
      default: false,
    },
    // autoCheckout - true if system checked them out
    // because they forgot to do it
    autoCheckout: {
      type: Boolean,
      default: false,
    },
    // notes - any extra notes
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Only one attendance record per employee per shift
attendanceSchema.index({ shift: 1, employee: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
