// ShiftRequest.js
// This is the ShiftRequest model.
// Employees submit requests to managers.
// Two types of requests:
// leave - asking for time off
// shift_change - asking to swap shifts
// Manager can approve or reject each one.

const mongoose = require("mongoose");

const shiftRequestSchema = new mongoose.Schema(
  {
    // type - what kind of request this is
    type: {
      type: String,
      enum: ["leave", "shift_change"],
      required: true,
    },
    // employee - who submitted this request
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // currentShift - the shift they are requesting about
    currentShift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },
    // requestedShift - only for shift_change type
    // the shift they want to change to
    requestedShift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
    },
    // reason - why they are making this request
    reason: {
      type: String,
    },
    // status - current state of the request
    // pending: waiting for manager decision
    // approved: manager said yes
    // rejected: manager said no
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    // managerNote - note from manager explaining decision
    managerNote: {
      type: String,
    },
    // resolvedAt - when the manager responded
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ShiftRequest", shiftRequestSchema);
