const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");
const notificationService = require("../services/notificationService");

exports.getMyNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getNotificationsForUser(
    req.user.id,
    req.query.page,
    req.query.limit
  );
  return sendSuccess(res, 200, {
    data: {
      notifications: result.data,
      unreadCount: result.unreadCount,
    },
    pagination: result.pagination,
  });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  const out = await notificationService.markAllNotificationsAsRead(req.user.id);
  return sendSuccess(res, 200, {
    message: "All notifications marked as read",
    data: out,
  });
});

exports.markOneRead = asyncHandler(async (req, res) => {
  const updated = await notificationService.markNotificationAsRead(
    req.params.id,
    req.user.id
  );
  return sendSuccess(res, 200, {
    message: "Notification marked as read",
    data: updated,
  });
});
