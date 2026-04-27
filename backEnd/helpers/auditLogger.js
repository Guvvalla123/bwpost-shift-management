// auditLogger.js
// Saves a record to the database whenever
// an important action happens in the system.
//
// Examples of actions recorded:
// - User logged in
// - Shift was created
// - Employee was deleted
// - Password was reset
// - CSV was exported
//
// Admins can view these records in the
// Audit Log page to see who did what and when.
// This is important for security and tracking.

const AuditLog = require("../models/AuditLog");

// log - saves one audit record to the database
// This is "fire and forget" - it does not wait for the save to finish
// so it does not slow down the response to the user.
//
// action - what happened, written as "resource.event"
//          example: "auth.login", "shift.create", "user.deactivate"
// req - the Express request object (used to get actor info and IP)
// targetType - what type of record was affected
//              example: "User", "Shift", "ShiftRequest"
// targetId - the ID of the specific record that was affected
// details - extra info about what happened (flexible object)
// override - optional: override the actor ID and role
//            used for public flows where req.user is not set
const log = (action, req, targetType = null, targetId = null, details = {}, override = {}) => {
  const actorId = override.actorId || req?.user?.id;
  if (!actorId) return;

  const entry = {
    action,
    actorId,
    actorRole: override.actorRole ?? req?.user?.role ?? "employee",
    targetType: targetType || undefined,
    targetId: targetId || undefined,
    details: Object.keys(details).length ? details : undefined,
    ip: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.get?.("user-agent"),
  };

  // Save to database but do not block the response
  // If this fails it logs an error but does not crash the request
  AuditLog.create(entry).catch((err) => console.error("AuditLog create error:", err));
};

module.exports = { log };
