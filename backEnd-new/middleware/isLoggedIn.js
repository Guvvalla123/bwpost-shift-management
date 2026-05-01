// isLoggedIn.js
// This middleware checks if a user is
// logged in before allowing access to
// protected routes.
//
// HOW IT WORKS STEP BY STEP:
// 1. User makes a request to a protected route
// 2. This middleware runs first
// 3. It reads the "token" cookie from request
// 4. It verifies the token using JWT_SECRET
// 5. If valid it finds the user in database
// 6. It adds user info to req.user
// 7. It calls next() to continue to the route
// 8. If invalid it sends 401 Unauthorized
//
// How to use this in routes:
// const isLoggedIn = require("../middleware/isLoggedIn")
// router.get("/shifts", isLoggedIn, getShifts)

// This means only logged in users can
// access the getShifts controller

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../helpers/sendResponse");

// isLoggedIn - verifies the user token
// and adds user data to req.user
async function isLoggedIn(req, res, next) {
  try {
    // Read the token from the cookie
    // The cookie was set when user logged in
    const token = req.cookies.token;

    // If no token the user is not logged in
    if (!token) {
      return sendError(res, 401, "Please login");
    }

    // Verify the token is valid and not expired
    // jwt.verify throws error if invalid
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user in database using ID from token
    const user = await User.findById(decoded.id);

    // If user not found in database
    if (!user) {
      return sendError(res, 401, "User not found");
    }

    // If account is disabled
    if (!user.isActive) {
      return sendError(res, 401, "Account disabled");
    }

    // Add user info to request object
    // Controllers can now access req.user
    req.user = { id: user._id, role: user.role };

    // Continue to the next middleware or controller
    next();
  } catch (error) {
    return sendError(res, 401, "Invalid or expired token");
  }
}

module.exports = isLoggedIn;
