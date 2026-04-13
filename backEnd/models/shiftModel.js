const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    shiftTitle: { type: String, required: true, trim: true },
    shiftStartTime: { type: Date, required: true },
    shiftEndTime: { type: Date, required: true },
    createdByManager: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    acceptedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    shiftNotes: { type: String, trim: true, maxlength: 300 },
    slotsAvailable: { type: Number, required: true, default: 1 },
    // Attendance tracked in separate Attendance
    // collection (attendanceModel.js)
    // Query: Attendance.find({ shift: this._id })
  },
  { timestamps: true }
);

/* ── Indexes for query performance at scale ── */
shiftSchema.index({ createdByManager: 1, shiftStartTime: -1 });
shiftSchema.index({ shiftStartTime: 1, slotsAvailable: 1 });
shiftSchema.index({ acceptedEmployees: 1 });
shiftSchema.index({ createdByManager: 1, createdAt: -1 });

// validation
shiftSchema.pre("save", function (next) {
  if (this.shiftEndTime <= this.shiftStartTime) {
    return next(new Error("Shift end time must be after shift start time"));
  }
  next();
});

module.exports = mongoose.model("Shift", shiftSchema);
