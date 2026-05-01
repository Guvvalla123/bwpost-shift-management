// saveAuditLog.js
// Saves a record of an important action
// to the AuditLog collection in MongoDB.
//
// This is called after things like:
// - A user logs in
// - A shift is created or deleted
// - A user account is deactivated
// - A password is reset
//
// We use try catch so if saving fails
// it does NOT break the main request.
// Audit logging should never cause errors.

const AuditLog = require("../models/AuditLog");

// saveAuditLog - saves one audit log record
// action - what happened eg "shift.created"
// userId - the ID of who did it
// userRole - their role at the time
// details - extra info as an object
// ipAddress - their IP address
async function saveAuditLog(action, userId, userRole, details, ipAddress) {
  try {
    // Create and save the audit log record
    await AuditLog.create({
      action,
      performedBy: userId,
      performedByRole: userRole,
      details,
      ipAddress,
    });
  } catch (error) {
    // Log error but do not throw it
    // We never want audit logging to break
    // the main request the user is making
    console.log("Audit log failed:", error.message);
  }
}

module.exports = saveAuditLog;
