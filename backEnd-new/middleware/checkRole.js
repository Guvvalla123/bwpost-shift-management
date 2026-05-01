// checkRole.js
// This middleware checks if the logged in user
// has permission to access a specific route.
//
// IMPORTANT: isLoggedIn must run BEFORE checkRole
// because checkRole reads req.user which is
// set by isLoggedIn middleware.
//
// HOW IT WORKS:
// 1. isLoggedIn runs and sets req.user
// 2. checkRole runs next
// 3. It checks if req.user.role is in the
//    list of allowed roles
// 4. If yes it calls next() to continue
// 5. If no it sends 403 Forbidden error
//
// HOW TO USE:
// router.get(
//   "/all-shifts",
//   isLoggedIn,
//   checkRole("manager", "admin"),
//   getAllShifts
// )
// Only managers and admins can access

const { sendError } = require("../helpers/sendResponse");

// checkRole - returns middleware function
// that checks the user role
// Pass allowed roles as arguments
// Example: checkRole("admin") or
// checkRole("admin", "manager")
function checkRole(...allowedRoles) {
  // Return the actual middleware function
  return function (req, res, next) {
    // Extra safety if someone forgot isLoggedIn
    if (!req.user) {
      return sendError(res, 401, "Please login");
    }
    // Check if user role is in allowed list
    if (!allowedRoles.includes(req.user.role)) {
      // Role not allowed - send 403 Forbidden
      return sendError(res, 403, "You do not have permission to do this");
    }
    // Role is allowed - continue to controller
    next();
  };
}

module.exports = checkRole;
