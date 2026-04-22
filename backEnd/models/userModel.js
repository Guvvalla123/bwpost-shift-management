const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      select: false, // never expose password
    },

    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },

    refreshToken: {
      type: String,
      select: false,
    },

    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },

    profileImage: {
      type: String,
      default: "", // Cloudinary URL
    },

    // Reporting relationship: employee's assigned manager (employees only)
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // Soft delete: maintain historical integrity
    isActive: { type: Boolean, default: true },
    deactivatedAt: { type: Date, default: null },
    deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // OneSignal web push subscription id (per browser/device)
    oneSignalPlayerId: { type: String, default: null, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ── Indexes for query performance at scale ── */
userSchema.index({ role: 1 });
userSchema.index({ refreshToken: 1 });
userSchema.index({ managerId: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

/* ── Employees must have managerId (reporting hierarchy) ── */
userSchema.pre("save", function (next) {
  if (this.role === "employee" && !this.managerId) {
    return next(new Error("Employees must be assigned to a manager"));
  }
  next();
});

/* ── Exclude inactive users by default; use _includeInactive: true to bypass ── */
userSchema.pre(/^find/, function (next) {
  const q = this.getQuery();
  if (q._includeInactive) {
    delete q._includeInactive;
    return next();
  }
  if (q.isActive !== undefined) return next();
  this.where({ isActive: { $ne: false } });
  next();
});

// Hash password before saving; clear password-reset artifacts when password changes
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.isNew) {
    this.passwordResetTokenHash = null;
    this.passwordResetExpires = null;
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
