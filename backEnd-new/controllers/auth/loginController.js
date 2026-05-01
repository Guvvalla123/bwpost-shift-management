// loginController.js
// This controller handles user login.
// Called when user submits the login form.
//
// Route: POST /api/users/login
//
// What this does step by step:
// 1. Gets email and password from request body
// 2. Finds the user in database by email
// 3. Checks if password is correct
// 4. Creates JWT tokens and stores in cookies
// 5. Saves audit log that user logged in
// 6. Returns user data to frontend

// User model to search the database
const User = require("../../models/User");

// sendTokens to create and set JWT cookies
const { sendTokens } = require("../../helpers/createToken");

// sendSuccess and sendError for API responses
const { sendSuccess, sendError } = require("../../helpers/sendResponse");

// saveAuditLog to record this login action
const saveAuditLog = require("../../helpers/saveAuditLog");

// bcryptjs to compare entered password
// with the hashed password in database
const bcrypt = require("bcryptjs");

// login - handles user login request
// Called when user submits the login form
//
// What it does:
// 1. Gets email and password from request body
// 2. Finds the user in database by email
// 3. Checks if password is correct
// 4. Creates JWT tokens and sets cookies
// 5. Saves audit log record
// 6. Returns user data to frontend
//
// Request body needed:
// { email: "user@example.com", password: "pass123" }
//
// Returns: user object with id name email role
async function loginController(req, res, next) {
  try {
    // Get email and password from request body
    const { email, password } = req.body;

    // Find user by email
    // We use +password because password field
    // has select: false in the model
    // so we need to explicitly include it
    const user = await User.findOne({ email }).select("+password");

    // If no user found with this email
    if (!user) {
      return sendError(res, 401, "Invalid email or password");
    }

    // Check if the account is active
    if (!user.isActive) {
      return sendError(
        res,
        401,
        "Your account has been disabled. Please contact your manager."
      );
    }

    // Compare the password with the stored hash
    // bcrypt.compare returns true or false
    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    // If password is wrong
    if (!passwordIsCorrect) {
      return sendError(res, 401, "Invalid email or password");
    }

    // Create JWT tokens and set cookies
    // This also returns the refresh token string
    const refreshTokenStr = sendTokens(user._id, user.role, res);

    // Save the refresh token to database
    // We compare this later when refreshing
    user.refreshToken = refreshTokenStr;
    await user.save();

    // Save audit log - user logged in
    await saveAuditLog(
      "user.login",
      user._id,
      user.role,
      { email: user.email },
      req.ip
    );

    // Send success response with user data
    // We do not send the password back
    return sendSuccess(res, 200, "Login successful", {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    // Pass error to error handler middleware
    next(error);
  }
}

// Export the login controller function
module.exports = loginController;
