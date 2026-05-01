// getAllInvitesController.js
// Route: GET /api/invites
// Who: admin or manager
// Lists invites with paging and optional status filter.
//
// Status meanings:
// - pending : not used and not expired yet
// - used    : acceptance recorded
// - expired : still unused past expiresAt

const Invite = require("../../models/Invite");

const { sendSuccess } = require("../../helpers/sendResponse");

// getAllInvitesController - returns filtered invite pages
async function getAllInvitesController(
  req,
  res,
  next
) {
  try {
    // Parse pagination from query string
    const page =
      parseInt(req.query.page, 10) || 1;

    const limit =
      parseInt(req.query.limit, 10) || 10;

    const skip = (page - 1) * limit;

    // Managers only see invites they authored
    const filter = {};

    if (req.user.role === "manager") {
      filter.createdBy = req.user.id;
    }

    const now = new Date();

    const status = req.query.status;

    // Narrow by lifecycle bucket when requested
    if (
      status === "pending"
    ) {
      filter.usedAt = null;

      filter.expiresAt = { $gt: now };
    } else if (status === "used") {
      filter.usedAt = { $ne: null };
    } else if (
      status === "expired"
    ) {
      filter.usedAt = null;

      filter.expiresAt = { $lte: now };
    }

    const totalInvites =
      await Invite.countDocuments(filter);

    const invites = await Invite.find(filter)
      .populate(
        "createdBy",
        "username email"
      )

      .sort({ createdAt: -1 })

      .skip(skip)
      .limit(limit);

    return sendSuccess(
      res,

      200,

      "Invites loaded",

      {
        invites,

        pagination: {
          currentPage: page,

          totalPages:
            Math.ceil(
              totalInvites / limit
            ) || 1,

          totalInvites,

          limit,
        },
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports =
  getAllInvitesController;
