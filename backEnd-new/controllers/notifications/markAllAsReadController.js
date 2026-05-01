// markAllAsReadController.js
// Route: PUT /api/notifications/read-all
// Who: any logged-in user
// Bulk update for anything still unread.

const Notification = require("../../models/Notification");

const {
  sendSuccess,
} = require("../../helpers/sendResponse");

// markAllAsReadController - clears badge in one query
async function markAllAsReadController(
  req,
  res,
  next
) {
  try {
    const result =
      await Notification.updateMany(
        {
          recipient: req.user.id,

          isRead: false,
        },
        {
          $set: { isRead: true },
        }
      );

    return sendSuccess(
      res,

      200,

      "All notifications marked as read",

      {
        markedCount:
          result.modifiedCount,
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports =
  markAllAsReadController;
