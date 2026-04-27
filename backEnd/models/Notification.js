// Notification.js
// This file defines how a Notification
// is stored in the MongoDB database.
//
// Notifications are sent to users when
// important things happen. For example:
// - a new shift is available
// - employee was auto checked out
// - shift request was approved
//
// Users can see notifications in the
// bell icon in the top navigation bar.

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // recipient - which user this notification is for
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // type - what kind of notification this is
    // "new_shift": a new shift is available to apply for
    // "auto_checkout": system checked out the employee automatically
    // "shift_reminder": reminder that a shift is starting soon
    // "general": any other kind of notification
    type: {
      type: String,
      enum: ["new_shift", "auto_checkout", "shift_reminder", "general"],
      required: true,
    },

    // title - the short heading shown in the notification
    // example: "New shift available"
    title: { type: String, required: true, trim: true },

    // message - the full notification text shown to the user
    // example: "A new Morning Shift on Dec 5 is available for you"
    message: { type: String, required: true, trim: true },

    // isRead - false means the user has not seen this notification yet
    // true means the user has read it
    isRead: { type: Boolean, default: false },

    // relatedShift - if this notification is about a specific shift,
    // this links to that shift document
    // null if not related to a specific shift
    relatedShift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
    },
  },
  { timestamps: true }
);

// Speed up getting all unread notifications for a user
notificationSchema.index({ recipient: 1, isRead: 1 });

// Speed up getting all notifications for a user sorted by newest first
notificationSchema.index({ recipient: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
