const mongoose = require("mongoose");
const Notification = require("../models/notificationModel");
const AppError = require("../utils/AppError");
const { getPaginationParams, getPaginationMeta } = require("../utils/paginate");

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

async function createBulkNotifications(recipientIds, type, title, message, relatedShiftId = null) {
  if (!recipientIds || !recipientIds.length) {
    return { created: 0 };
  }
  const docs = recipientIds.map((rid) => ({
    recipient: rid,
    type,
    title,
    message,
    relatedShift: relatedShiftId || undefined,
  }));
  const inserted = await Notification.insertMany(docs);
  return { created: inserted.length, count: inserted.length };
}

async function getNotificationsForUser(userId, page, limit) {
  const { page: p, limit: l, skip } = getPaginationParams(
    { page, limit },
    20,
    50
  );
  const filter = { recipient: userId };

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(l)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  return {
    data: items,
    pagination: getPaginationMeta(total, p, l),
    unreadCount,
  };
}

async function markNotificationAsRead(notificationId, userId) {
  const nid =
    typeof notificationId === "string"
      ? new mongoose.Types.ObjectId(notificationId)
      : notificationId;
  const uid =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;

  const updated = await Notification.findOneAndUpdate(
    { _id: nid, recipient: uid },
    { $set: { isRead: true } },
    { new: true }
  );
  if (!updated) {
    throw new AppError("Notification not found", 404);
  }
  return updated;
}

async function markAllNotificationsAsRead(userId) {
  const uid =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  const result = await Notification.updateMany(
    { recipient: uid, isRead: false },
    { $set: { isRead: true } }
  );
  return { modifiedCount: result.modifiedCount };
}

async function getUnreadCount(userId) {
  const uid =
    typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  return Notification.countDocuments({ recipient: uid, isRead: false });
}

module.exports = {
  createNotification,
  createBulkNotifications,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
};
