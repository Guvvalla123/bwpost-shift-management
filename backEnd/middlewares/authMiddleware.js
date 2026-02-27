const jwt = require("jsonwebtoken");

/**
 * AUTH MIDDLEWARE (COOKIE BASED)
 * Reads JWT from HTTP-only cookie
 */
const auth = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Not authenticated, token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id || !decoded?.role) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    req.user = {
      id: decoded.id,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

/**
 * ROLE AUTHORIZATION MIDDLEWARE
 * Usage: authorize("manager"), authorize("employee")
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Not authenticated",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = {
  auth,
  authorize,
};
