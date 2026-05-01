// getAuditLogsController.js
// Route: GET /api/admin/audit-logs
// Who: admin only
// Operational history with optional substring filter.

const AuditLog =
  require("../../models/AuditLog");

const {
  sendSuccess,
} = require("../../helpers/sendResponse");

function escapeRegex(text) {
  return String(text).replace(
    /[.*+?^${}()|[\]\\]/g,

    "\\$&"
  );
}

// getAuditLogsController - chronological compliance feed
async function getAuditLogsController(
  req,
  res,
  next
) {
  try {
    const page =
      parseInt(req.query.page, 10) || 1;

    const limit =
      parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    const filter = {};

    const search = req.query.search;

    // Filter by substring inside action slug
    if (search && search.trim()) {
      const safe =
        escapeRegex(search.trim());

      filter.action = new RegExp(
        safe,

        "i"
      );
    }

    const totalLogs =
      await AuditLog.countDocuments(
        filter
      );

    const logs = await AuditLog.find(filter)

      .populate(
        "performedBy",

        "username email role"
      )

      .sort({ createdAt: -1 })

      .skip(skip)
      .limit(limit);

    return sendSuccess(res, 200, "Audit logs loaded", {
      logs,

      pagination: {
        currentPage: page,

        totalPages:
          Math.ceil(
            totalLogs / limit
          ) || 1,

        totalLogs,

        limit,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports =
  getAuditLogsController;
