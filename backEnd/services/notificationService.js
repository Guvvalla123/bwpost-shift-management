const mongoose = require("mongoose");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");
const { getPaginationParams, getPaginationMeta } = require("../utils/paginate");
const { sendPushToUser, sendPushToUsers } = require("./oneSignalService");

function buildPushData(type, relatedShiftId, extra) {
  const d = { type: String(type), ...extra };
  if (relatedShiftId) d.relatedShift = String(relatedShiftId);
  return d;
}

async function createNotification(recipientId, type, title, message, relatedShiftId = null) {
  const doc = await Notification.create({
    recipient: recipientId,
    type,
    title,
    message,
    relatedShift: relatedShiftId || undefined,
  });
  try {
    const user = await User.findById(recipientId).select("oneSignalPlayerId").lean();
    if (user?.oneSignalPlayerId) {
      const pushData = buildPushData(type, relatedShiftId, { notificationId: String(doc._id) });
      await sendPushToUser(user.oneSignalPlayerId, title, message, pushData);
    }
  } catch (err) {
    console.error("OneSignal createNotification side effect failed:", err.message);
  }
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
  try {
    const userRows = await User.find({ _id: { $in: recipientIds } })
      .select("oneSignalPlayerId")
      .lean();
    const playerIds = userRows
      .map((u) => u.oneSignalPlayerId)
      .filter((x) => typeof x === "string" && x.trim());
    if (playerIds.length) {
      const pushData = buildPushData(type, relatedShiftId, { bulk: "true" });
      await sendPushToUsers(playerIds, title, message, pushData);
    }
  } catch (err) {
    console.error("OneSignal createBulkNotifications side effect failed:", err.message);
  }
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
