// Invite.js
// This file defines how an Invite is stored
// in the MongoDB database.
//
// When admin wants to add a new manager or
// employee they create an invite.
// The invite generates a unique link.
// The new user clicks the link to register.
// The link expires after 7 days.
// The link can only be used once.

const mongoose = require("mongoose");
const crypto = require("crypto");

const inviteSchema = new mongoose.Schema(
  {
    // email - the email address this invite was sent to
    // the new user must register with this exact email
    email: { type: String, required: true, lowercase: true },

    // role - what role the new user will have after registering
    // can be "employee", "manager", or "admin"
    role: { type: String, required: true, enum: ["employee", "manager", "admin"] },

    // managerId - for employee invites only: which manager will be their boss
    // null for manager and admin invites
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // token - the unique secret token included in the invite link
    // this is stored as plain text (not sensitive, link is emailed)
    token: { type: String, required: true, unique: true },

    // createdBy - which admin or manager created this invite
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    // expiresAt - when this invite link stops working
    // typically set to 7 days from creation
    expiresAt: { type: Date, required: true },

    // usedAt - the date and time when someone registered using this invite
    // null means the invite has not been used yet
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Speed up finding active invites for a specific email
inviteSchema.index({ email: 1, usedAt: 1 });

// Static method: generates a random secure token for the invite link
inviteSchema.statics.generateToken = () => crypto.randomBytes(32).toString("hex");

module.exports = mongoose.model("Invite", inviteSchema);
