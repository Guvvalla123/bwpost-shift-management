const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const AppError = require("../utils/AppError");

/**
 * AUTH MIDDLEWARE (COOKIE BASED)
 * Reads JWT from HTTP-only cookie, rejects deactivated users
 */
const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return next(new AppError("Not authenticated, token missing", 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id || !decoded?.role) {
      return next(new AppError("Invalid token payload", 401));
    }

    const user = await User.findOne({ _id: decoded.id, _includeInactive: true })
      .select("isActive")
      .lean();
    if (!user) {
      return next(new AppError("User not found", 401));
    }
    if (user.isActive === false) {
      return next(new AppError("Account has been deactivated", 403));
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    next(error);
  }
};

/**
 * ROLE AUTHORIZATION MIDDLEWARE
 * Usage: authorize("manager"), authorize("employee")
 */
const authorize = (...allowedRoles) => {
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

module.exports = {
  auth,
  authorize,
};
