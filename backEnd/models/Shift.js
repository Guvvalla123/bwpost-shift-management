// Shift.js
// This file defines how a Shift is stored
// in the MongoDB database.
//
// A shift is a work period that employees
// can be assigned to.
// Managers create shifts and employees
// check in when their shift starts.

const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    // shiftTitle - the name of the shift, shown to employees
    // example: "Morning Shift" or "Weekend Cover"
    shiftTitle: { type: String, required: true, trim: true },

    // shiftStartTime - the date and time when this shift begins
    shiftStartTime: { type: Date, required: true },

    // shiftEndTime - the date and time when this shift ends
    // must be after shiftStartTime (checked in pre-save hook below)
    shiftEndTime: { type: Date, required: true },

    // createdByManager - which manager created this shift
    // links to a User document with role "manager"
    createdByManager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // acceptedEmployees - list of employees assigned to work this shift
    // each item links to a User document with role "employee"
    acceptedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // shiftNotes - optional notes the manager added about this shift
    // example: "Please wear uniform" or "Meet at back entrance"
    shiftNotes: { type: String, trim: true, maxlength: 300 },

    // slotsAvailable - how many more employees can still join this shift
    // decreases when an employee applies, increases when they cancel
    slotsAvailable: { type: Number, required: true, default: 1 },

    // Attendance records for this shift are stored separately
    // in the Attendance collection (Attendance.js).
    // To find them: Attendance.find({ shift: this._id })
  },
  { timestamps: true }
);

/* ── Indexes for query performance at scale ── */
// Speed up getting all shifts created by a specific manager, sorted by date
shiftSchema.index({ createdByManager: 1, shiftStartTime: -1 });

// Speed up finding upcoming shifts that still have open slots
shiftSchema.index({ shiftStartTime: 1, slotsAvailable: 1 });

// Speed up finding all shifts an employee is assigned to
shiftSchema.index({ acceptedEmployees: 1 });

// Speed up getting recent shifts for a manager
shiftSchema.index({ createdByManager: 1, createdAt: -1 });

// Pre-save validation: shift must end after it starts
shiftSchema.pre("save", function (next) {
  if (this.shiftEndTime <= this.shiftStartTime) {
    return next(new Error("Shift end time must be after shift start time"));
  }
  next();
});

module.exports = mongoose.model("Shift", shiftSchema);
