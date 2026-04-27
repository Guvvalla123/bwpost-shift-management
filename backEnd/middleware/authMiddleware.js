// authMiddleware.js
// This middleware checks if a user is
// logged in before allowing access to
// protected API routes.
//
// HOW IT WORKS:
// 1. A request comes in to the server
// 2. This middleware runs before the
//    controller function
// 3. It reads the "token" cookie from
//    the request
// 4. It verifies the JWT token using
//    the JWT_SECRET from .env file
// 5. If the token is valid it adds the
//    user data to req.user so controllers
//    can access it
// 6. If the token is invalid or missing
//    it sends a 401 Unauthorized error
//
// HOW TO USE IN ROUTES:
// const { isLoggedIn } = require("../middleware/authMiddleware");
//
// router.get("/shifts", isLoggedIn, getAllShifts);
// This means only logged in users can
// access the shifts route.

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../helpers/AppError");

// isLoggedIn - checks if user has valid token
// If token is valid adds user to req.user
// If token is missing sends 401 error
// If token is expired sends 401 error
const isLoggedIn = async (req, res, next) => {
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

module.exports = { isLoggedIn };
