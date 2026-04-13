const mongoose = require("mongoose");
const crypto = require("crypto");

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true },
    role: { type: String, required: true, enum: ["employee", "manager", "admin"] },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // For employees: assigned manager
    token: { type: String, required: true, unique: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

inviteSchema.index({ email: 1, usedAt: 1 });

inviteSchema.statics.generateToken = () => crypto.randomBytes(32).toString("hex");

module.exports = mongoose.model("Invite", inviteSchema);
