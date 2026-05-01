// getMyNotificationsController.js
// Route: GET /api/notifications
// Who: any logged-in user
// Returns newest 20 rows plus unread total.

const Notification = require("../../models/Notification");

const {
  sendSuccess,
} = require("../../helpers/sendResponse");

// getMyNotificationsController - bell dropdown payload
async function getMyNotificationsController(
  req,
  res,
  next
) {
  try {
    // Current account from JWT middleware
    const meId = req.user.id;

    // Recent items only to keep payloads small
    const notifications =
      await Notification.find({
        recipient: meId,
      })
        .sort({ createdAt: -1 })
        .limit(20);

    // Count unseen rows for badge
    const unreadCount =
      await Notification.countDocuments({
        recipient: meId,

        isRead: false,
      });

    return sendSuccess(
      res,

      200,

      "Notifications loaded",

      {
        notifications,

        unreadCount,
      }
    );
  } catch (error) {
    next(error);
  }
}

module.exports =
  getMyNotificationsController;
