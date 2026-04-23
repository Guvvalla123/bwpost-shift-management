const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const sessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, select: false },
    deviceInfo: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { _id: true }
);

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
      select: false,
    },

    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },

    /** @deprecated use refreshTokens. Kept for migration and backward compatibility. */
    refreshToken: {
      type: String,
      select: false,
    },

    refreshTokens: {
      type: [sessionSchema],
      default: [],
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
      default: "",
    },

    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    isActive: { type: Boolean, default: true },
    deactivatedAt: { type: Date, default: null },
    deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ── Indexes ── */
userSchema.index({ role: 1 });
userSchema.index({ refreshToken: 1 });
userSchema.index({ "refreshTokens.token": 1 }, { sparse: true });
userSchema.index({ managerId: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

userSchema.pre("save", function (next) {
  if (this.role === "employee" && !this.managerId) {
    return next(new Error("Employees must be assigned to a manager"));
  }
  next();
});

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

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.isNew) {
    this.passwordResetTokenHash = null;
    this.passwordResetExpires = null;
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.removeExpiredSessions = function removeExpiredSessions() {
  if (!this.refreshTokens?.length) return;
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter((s) => s.expiresAt > now);
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
