// User.js
// This is the User model for MongoDB.
// Every person who uses the app has a
// record in this users collection.
//
// There are 3 roles:
// admin   - manages the whole system
// manager - manages their team of employees
// employee - checks in and out of shifts

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // username - the display name shown in the app
    username: {
      type: String,
      trim: true,
    },
    // email - used for login, must be unique
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // password - stored as bcrypt hash, never plain text
    password: {
      type: String,
      required: true,
      select: false,
    },
    // role - what type of user this is
    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
      default: "employee",
    },
    // managerId - only for employees
    // tells us which manager they report to
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    // isActive - false means account is disabled
    // we never delete users, just deactivate
    isActive: {
      type: Boolean,
      default: true,
    },
    // profileImage - URL of profile photo
    profileImage: {
      type: String,
      default: "",
    },
    // refreshToken - saved when user logs in
    // used to create new access tokens
    refreshToken: {
      type: String,
      select: false,
    },
    // passwordResetToken - temporary token for reset
    passwordResetToken: {
      type: String,
    },
    // passwordResetExpires - when reset token expires
    passwordResetExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Before saving check if password was changed
// If yes hash it using bcrypt with 10 rounds
// We use 10 rounds as a balance of
// security and performance
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

module.exports = mongoose.model("User", userSchema);
