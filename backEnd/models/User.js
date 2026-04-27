// User.js
// This file defines how a User is stored
// in the MongoDB database.
//
// A user can be one of three roles:
// - admin: manages the whole system
// - manager: manages a team of employees
// - employee: checks in and out of shifts
//
// When a user logs in we check their
// email and password stored here.

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// sessionSchema holds one active login session for a user.
// One user can have up to 5 active sessions at the same time.
// Example: logged in on both phone and laptop.
const sessionSchema = new mongoose.Schema(
  {
    // token - hashed refresh token for this session (never stored raw)
    token: { type: String, required: true, select: false },
    // deviceInfo - browser or device name, shown to user in active sessions list
    deviceInfo: { type: String, default: "" },
    // ipAddress - the IP address this session was created from
    ipAddress: { type: String, default: "" },
    // createdAt - when this session was created (login time)
    createdAt: { type: Date, default: Date.now },
    // lastUsedAt - last time this session refreshed its access token
    lastUsedAt: { type: Date, default: Date.now },
    // expiresAt - when this session expires (8 hours after login)
    expiresAt: { type: Date, required: true },
  },
  { _id: true }
);

const userSchema = new mongoose.Schema(
  {
    // username - the display name shown in the app
    username: {
      type: String,
      required: true,
      trim: true,
    },

    // email - the user's email address, used for login, must be unique
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    // password - stored as a bcrypt hash, never stored as plain text
    // select: false means this field is not returned in queries by default
    password: {
      type: String,
      required: true,
      select: false,
    },

    // role - what type of user this is
    // can be admin, manager, or employee
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },

    // refreshToken - old single session field, kept for backward compatibility
    // new code uses the refreshTokens array below instead
    /** @deprecated use refreshTokens. Kept for migration and backward compatibility. */
    refreshToken: {
      type: String,
      select: false,
    },

    // refreshTokens - list of all active login sessions for this user
    // each item in the array uses sessionSchema defined above
    refreshTokens: {
      type: [sessionSchema],
      default: [],
      select: false,
    },

    // passwordResetTokenHash - hashed version of the password reset token
    // null means there is no active password reset request
    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    // passwordResetExpires - when the password reset token expires
    // after this time the reset link no longer works
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // profileImage - URL of the user's profile picture
    // must be a Cloudinary HTTPS URL or empty string
    profileImage: {
      type: String,
      default: "",
    },

    // managerId - for employees only: links this employee to their manager
    // null for admin and manager roles
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // isActive - false means this account has been deactivated
    // deactivated users cannot log in
    isActive: { type: Boolean, default: true },

    // deactivatedAt - the date and time when this account was deactivated
    deactivatedAt: { type: Date, default: null },

    // deactivatedBy - which admin or manager deactivated this account
    deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    // timestamps automatically adds createdAt and updatedAt fields
    timestamps: true,
    versionKey: false,
  }
);

/* ── Indexes ── */
// Indexes make database queries faster.
// Without indexes MongoDB scans every document.
// With indexes it jumps directly to the right documents.

// Speed up queries that filter by role
userSchema.index({ role: 1 });

// Speed up queries using the old single refreshToken field
userSchema.index({ refreshToken: 1 });

// Speed up finding a session by its token hash
userSchema.index({ "refreshTokens.token": 1 }, { sparse: true });

// Speed up getting all employees under a manager
userSchema.index({ managerId: 1 });

// Speed up filtering out deactivated users
userSchema.index({ isActive: 1 });

// Speed up the login query (find by email, check isActive)
userSchema.index({ email: 1, isActive: 1 });

// Speed up finding user by their password reset token
userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

// Pre-save hook: every employee must have a manager assigned
userSchema.pre("save", function (next) {
  if (this.role === "employee" && !this.managerId) {
    return next(new Error("Employees must be assigned to a manager"));
  }
  next();
});

// Pre-find hook: automatically exclude deactivated users from all queries
// To include deactivated users, add { _includeInactive: true } to the query
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

// Pre-save hook: hash the password before saving to database
// Only runs if password field was changed
// bcrypt cost factor 12 gives good security without being too slow
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (!this.isNew) {
    // Clear any active password reset token when password changes
    this.passwordResetTokenHash = null;
    this.passwordResetExpires = null;
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method: remove sessions that have already expired
// Called before saving to keep the sessions array clean
userSchema.methods.removeExpiredSessions = function removeExpiredSessions() {
  if (!this.refreshTokens?.length) return;
  const now = new Date();
  this.refreshTokens = this.refreshTokens.filter((s) => s.expiresAt > now);
};

// Method: check if a plain text password matches the stored hash
// Used during login to verify the password the user typed
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
