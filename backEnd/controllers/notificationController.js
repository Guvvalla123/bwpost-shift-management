// notificationController.js
// This file handles notifications.
// Users see notifications in the bell icon.
//
// ROUTES THAT USE THIS CONTROLLER:
// GET /api/notifications
// PUT /api/notifications/read-all
// PUT /api/notifications/:id/read
//
// WHEN NOTIFICATIONS ARE CREATED:
// 1. Manager creates new shift
//    Employees below 40hrs get notified
// 2. Employee forgets to check out
//    Auto checkout sends notification
// 3. Shift request approved or rejected
//    Employee gets notified

const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const AppError = require("../helpers/AppError");
const asyncHandler = require("../helpers/asyncHandler");
const { sendSuccess } = require("../helpers/sendResponse");
const { getPaginationParams, getPaginationMeta } = require("../helpers/pagination");

// ─── HELPER FUNCTIONS (exported for use by other controllers) ─────────────────

// createNotification - creates one notification in the database
// Called whenever something important happens that the user should know about
// recipientId - the user who will see the notification
// type        - category of notification (e.g. "auto_checkout", "new_shift")
// title       - short heading shown in the bell dropdown
// message     - full description shown when notification is opened
// relatedShiftId - optional shift ID so the user can click to view it
async function createNotification(recipientId, type, title, message, relatedShiftId = null) {
  const doc = await Notification.create({
    recipient: recipientId,
    type,
    title,
    message,
    relatedShift: relatedShiftId || undefined,
  });
  return doc;
}

// createBulkNotifications - creates notifications for many users at once
// Used when a new shift is created to notify all eligible employees
// recipientIds - array of user IDs who will receive the notification
async function createBulkNotifications(recipientIds, type, title, message, relatedShiftId = null) {
  // If no recipients just return without doing anything
  if (!recipientIds || !recipientIds.length) {
    return { created: 0 };
  }

  // Build one notification document per recipient
  const docs = recipientIds.map((rid) => ({
    recipient: rid,
    type,
    title,
    message,
    relatedShift: relatedShiftId || undefined,
  }));

  // Insert all notifications in a single database operation
  const inserted = await Notification.insertMany(docs);
  return { created: inserted.length, count: inserted.length };
}

// ─── ROUTE HANDLER FUNCTIONS ──────────────────────────────────────────────────

// getMyNotifications - gets all notifications for the logged in user
// Returns notifications with pagination and total unread count
exports.getMyNotifications = asyncHandler(async (req, res) => {
  // Build pagination params from the query string
  const { page: p, limit: l, skip } = getPaginationParams(
    { page: req.query.page, limit: req.query.limit },
    20,
    50
  );

  // Filter to only this user's notifications
  const filter = { recipient: req.user.id };

  // Run all three queries in parallel for speed
  const [items, total, unreadCount] = await Promise.all([
    // Get the paginated list of notifications newest first
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    // Get total count for pagination
    Notification.countDocuments(filter),
    // Get unread count for the bell badge number
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  return sendSuccess(res, 200, {
    data: {
      notifications: items,
      unreadCount,
    },
    pagination: getPaginationMeta(total, p, l),
  });
});

// markAllAsRead - marks every notification as read for this user
// Called when user clicks "Mark all as read"
exports.markAllRead = asyncHandler(async (req, res) => {
  // Convert string ID to ObjectId for the database query
  const uid =
    typeof req.user.id === "string"
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;

  // Update all unread notifications for this user to isRead = true
  const result = await Notification.updateMany(
    { recipient: uid, isRead: false },
    { $set: { isRead: true } }
  );

  return sendSuccess(res, 200, {
    message: "All notifications marked as read",
    data: { modifiedCount: result.modifiedCount },
  });
});

// markOneAsRead - marks a single notification as read
// Called when user clicks on one notification
exports.markOneRead = asyncHandler(async (req, res) => {
  // Parse the notification ID from the URL
  const nid =
    typeof req.params.id === "string"
      ? new mongoose.Types.ObjectId(req.params.id)
      : req.params.id;

  // Parse the user ID for the query
  const uid =
    typeof req.user.id === "string"
      ? new mongoose.Types.ObjectId(req.user.id)
      : req.user.id;

  // Find the notification and update it only if it belongs to this user
  const updated = await Notification.findOneAndUpdate(
    { _id: nid, recipient: uid },
    { $set: { isRead: true } },
    { new: true }
  );

  // If nothing was updated the notification does not exist or belongs to another user
  if (!updated) {
    throw new AppError("Notification not found", 404);
  }

  return sendSuccess(res, 200, {
    message: "Notification marked as read",
    data: updated,
  });
});

// Export helpers so other controllers can create notifications
module.exports.createNotification = createNotification;
module.exports.createBulkNotifications = createBulkNotifications;
