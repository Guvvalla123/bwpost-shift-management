// AuditLog.js
// This is the AuditLog model.
// Every important action is saved here.
// Admins can see what happened and who did it.
// This is important for security tracking.
//
// Examples of actions logged:
// - User logged in
// - Shift was created
// - Employee was deactivated
// - Password was reset

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // action - what happened
    // examples: "user.login" "shift.created"
    action: {
      type: String,
      required: true,
    },
    // performedBy - who did this action
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // performedByRole - their role when they did it
    performedByRole: {
      type: String,
    },
    // details - extra information about the action
    // stored as a plain object
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
    // ipAddress - the IP address of the user
    ipAddress: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
