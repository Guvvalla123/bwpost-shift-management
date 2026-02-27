const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  totalHours: { type: Number, required: true },
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
