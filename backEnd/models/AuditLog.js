// AuditLog.js
// This file defines how Audit Logs are stored
// in the MongoDB database.
//
// Every important action in the system is
// recorded here. For example:
// - user logged in
// - shift was created
// - employee was deleted
// - password was reset
//
// Admins can view these logs to see
// who did what and when.

const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    // action - what happened, written as "resource.event"
    // examples: "user.create", "shift.update", "request.approve"
    action: { type: String, required: true },

    // actorId - which user performed this action
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // actorRole - the role of the user who performed the action
    // admin, manager, or employee
    actorRole: { type: String, required: true },

    // targetType - what kind of thing was affected
    // examples: "User", "Shift", "ShiftRequest"
    targetType: { type: String },

    // targetId - the ID of the specific record that was affected
    targetId: { type: mongoose.Schema.Types.ObjectId },

    // details - extra information about what happened
    // flexible object, contents depend on the action
    // example for "user.create": { role: "manager", email: "..." }
    details: { type: mongoose.Schema.Types.Mixed },

    // ip - the IP address of the user who performed the action
    ip: { type: String },

    // userAgent - the browser or client that made the request
    userAgent: { type: String },
  },
  { timestamps: true }
);

// Speed up getting all actions by a specific user, sorted by newest first
auditLogSchema.index({ actorId: 1, createdAt: -1 });

// Speed up filtering logs by action type, sorted by newest first
auditLogSchema.index({ action: 1, createdAt: -1 });

// Speed up finding all logs affecting a specific record
auditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model("AuditLog", auditLogSchema);
