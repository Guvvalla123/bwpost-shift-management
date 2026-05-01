// Invite.js
// This is the Invite model.
// Admins and managers create invites
// to add new users to the system.
// Each invite creates a unique link.
// The new user opens the link to register.
// Links expire after 7 days.
// Each link can only be used once.

const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    // email - the email address being invited
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    // role - what role the new user will get
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      required: true,
    },
    // managerId - required for employee invites
    // tells us which manager they will report to
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // token - the unique token in the invite link
    // this is a random string generated when invite is created
    token: {
      type: String,
      required: true,
      unique: true,
    },
    // createdBy - which admin or manager sent this invite
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // expiresAt - when this invite link expires
    expiresAt: {
      type: Date,
      required: true,
    },
    // usedAt - when the invite was accepted and used
    // null means it has not been used yet
    usedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Invite", inviteSchema);
