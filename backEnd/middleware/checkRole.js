// checkRole.js
// This middleware checks if the logged in
// user has the correct role to access
// a specific route.
//
// HOW IT WORKS:
// 1. isLoggedIn middleware runs first
//    and adds user data to req.user
// 2. checkRole middleware runs after
// 3. It checks req.user.role against
//    the allowed roles list
// 4. If role matches it calls next()
//    to allow access
// 5. If role does not match it sends
//    403 Forbidden error
//
// HOW TO USE IN ROUTES:
// const { isLoggedIn } = require("../middleware/authMiddleware");
// const { checkRole } = require("../middleware/checkRole");
//
// router.get("/shifts",
//   isLoggedIn,
//   checkRole("manager"),
//   getAllShifts
// );
//
// router.get("/users",
//   isLoggedIn,
//   checkRole("admin", "manager"),
//   getAllUsers
// );
// This allows both admin and manager.

const AppError = require("../helpers/AppError");

// checkRole - checks user has correct role
// ...allowedRoles - one or more role names
//   that are allowed to access this route
// Returns 403 Forbidden if role not in list
// Example: checkRole("admin", "manager")
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Not authenticated", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError("Access denied", 403));
    }

    next();
  };
};

module.exports = { checkRole };
