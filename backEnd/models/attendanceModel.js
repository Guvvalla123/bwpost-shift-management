const mongoose = require("mongoose");
const { Schema } = mongoose;

// ── Work session: each check-in/check-out pair within a shift ──
const workSessionSchema = new Schema(
  {
    checkIn: { type: Date, required: true },
    checkOut: { type: Date },
  },
  { _id: false }
);

// ── Break session: each break taken during a shift ──
const breakSessionSchema = new Schema(
  {
    start: { type: Date, required: true },
    end: { type: Date },
    type: { type: String, enum: ["lunch", "short_break"], default: "short_break" },
  },
  { _id: false }
);

// ── Main Attendance document (one per employee per shift) ──
const attendanceSchema = new Schema(
  {
    shift: {
      type: Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
      index: true,
    },
    employee: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["not_started", "checked_in", "on_break", "checked_out"],
      default: "not_started",
      index: true,
    },
    workSessions: [workSessionSchema],
    breaks: [breakSessionSchema],

    totalWorkMinutes: { type: Number, default: 0 },
    totalBreakMinutes: { type: Number, default: 0 },
    overtimeMinutes: { type: Number, default: 0 },

    isLate: { type: Boolean, default: false },
    lateByMins: { type: Number, default: 0 },
    leftEarly: { type: Boolean, default: false },

    checkIn: { type: Date },
    checkOut: { type: Date },
    totalHours: { type: Number, default: 0 },

    notes: { type: String, maxlength: 300 },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index(
  { shift: 1, employee: 1 },
  { unique: true, name: "unique_shift_employee" }
);

attendanceSchema.index({ shift: 1, status: 1 }, { name: "shift_status" });

attendanceSchema.index({ employee: 1, createdAt: -1 }, { name: "employee_history" });

attendanceSchema.index({ employee: 1, checkIn: -1 }, { name: "employee_checkin_history" });

const Attendance = mongoose.model("Attendance", attendanceSchema);
module.exports = Attendance;
