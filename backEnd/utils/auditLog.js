const AuditLog = require("../models/auditLogModel");

/**
 * Log an auditable action. Fire-and-forget (does not block response).
 * For public flows (e.g. invite.accept), pass override: { actorId, actorRole }.
 */
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

  AuditLog.create(entry).catch((err) => console.error("AuditLog create error:", err));
};

module.exports = { log };
