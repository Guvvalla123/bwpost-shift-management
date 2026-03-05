const mongoose = require("mongoose");

/* ── Work session: each check-in/check-out pair within a shift ── */
const workSessionSchema = new mongoose.Schema({
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },              // null while still checked in
}, { _id: false });

/* ── Break session: each break taken during a shift ── */
const breakSessionSchema = new mongoose.Schema({
  start: { type: Date, required: true },
  end: { type: Date },                 // null while on break
  type: { type: String, enum: ["lunch", "short_break"], default: "short_break" },
}, { _id: false });

/* ── Per-employee attendance record within a shift ── */
const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  /* State machine: not_started → checked_in → on_break → checked_in → checked_out */
  status: {
    type: String,
    enum: ["not_started", "checked_in", "on_break", "checked_out"],
    default: "not_started",
  },

  workSessions: [workSessionSchema],   // multiple in/out pairs
  breaks: [breakSessionSchema],  // multiple break pairs

  /* Computed totals (minutes) — recalculated on every action */
  totalWorkMinutes: { type: Number, default: 0 },
  totalBreakMinutes: { type: Number, default: 0 },
  overtimeMinutes: { type: Number, default: 0 },

  /* Flags */
  isLate: { type: Boolean, default: false },
  lateByMins: { type: Number, default: 0 },
  leftEarly: { type: Boolean, default: false },

  /* Legacy fields kept for backwards compat */
  checkIn: { type: Date },
  checkOut: { type: Date },
  totalHours: { type: Number, default: 0 },

  notes: { type: String, maxlength: 300 },
});

const shiftSchema = new mongoose.Schema(
  {
    shiftTitle: { type: String, required: true, trim: true },
    shiftStartTime: { type: Date, required: true },
    shiftEndTime: { type: Date, required: true },
    createdByManager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    acceptedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shiftNotes: { type: String, trim: true, maxlength: 300 },
    slotsAvailable: { type: Number, required: true, default: 1 },
    attendance: [attendanceSchema],
  },
  { timestamps: true }
);

// validation
shiftSchema.pre("save", function (next) {
  if (this.shiftEndTime <= this.shiftStartTime) {
    return next(new Error("Shift end time must be after shift start time"));
  }
  next();
});

module.exports = mongoose.model("Shift", shiftSchema);
