// Notification.js
// This is the Notification model.
// Notifications appear in the bell icon
// in the top navigation bar.
//
// When are notifications created:
// - Manager creates a new shift
// - Employee is auto checked out
// - Shift request is approved or rejected

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    // recipient - which user should see this
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // message - the text shown in the notification
    message: {
      type: String,
      required: true,
    },
    // type - what kind of notification this is
    // example: new_shift, auto_checkout, request_update
    type: {
      type: String,
    },
    // isRead - false means user has not seen it yet
    // changes to true when user clicks the bell
    isRead: {
      type: Boolean,
      default: false,
    },
    // relatedShift - the shift this notification is about
    // not all notifications are about a shift
    relatedShift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
