// Shift.js
// This is the Shift model.
// Managers create shifts.
// Employees can apply for available shifts.
// Each shift has a start time end time
// and a number of available slots.

const mongoose = require("mongoose");

const shiftSchema = new mongoose.Schema(
  {
    // shiftTitle - the name of this shift
    shiftTitle: {
      type: String,
      required: true,
    },
    // shiftStartTime - when the shift begins
    shiftStartTime: {
      type: Date,
      required: true,
    },
    // shiftEndTime - when the shift ends
    shiftEndTime: {
      type: Date,
      required: true,
    },
    // createdByManager - which manager created this
    createdByManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // acceptedEmployees - employees assigned to shift
    // this is an array of user IDs
    acceptedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // slotsAvailable - max employees for this shift
    slotsAvailable: {
      type: Number,
      required: true,
      default: 1,
    },
    // shiftNotes - any extra info about the shift
    shiftNotes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Shift", shiftSchema);
