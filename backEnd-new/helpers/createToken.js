// createToken.js
// This file creates JWT tokens and stores
// them in browser cookies.
//
// WHY WE USE HTTP-ONLY COOKIES:
// We store tokens in cookies instead of
// localStorage because:
// 1. JavaScript in the browser CANNOT read
//    HTTP-only cookies
// 2. This protects against XSS attacks where
//    someone tries to steal the token
// 3. The browser sends cookies automatically
//    with every request so we do not need
//    to attach the token manually
//
// TWO TOKENS:
// Access Token - expires in 15 minutes
//   stored in cookie named "token"
//   contains user ID and role
//
// Refresh Token - expires in 7 days
//   stored in cookie named "refreshToken"
//   used to get a new access token
//   when the old one expires

const jwt = require("jsonwebtoken");

// Cookie options shared by set and clear (path must match)
function getCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
}

// sendTokens - creates both JWT tokens
// and sets them as cookies on the response
//
// userId - the ID of the logged in user
// userRole - their role (admin/manager/employee)
// res - the Express response object
//       we need this to set the cookies
function sendTokens(userId, userRole, res) {
  const idString = userId.toString();

  // Create access token with user ID and role
  // Expires in 15 minutes for security
  const accessToken = jwt.sign(
    { id: idString, role: userRole },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "15m" }
  );

  // Create refresh token with only user ID
  // Expires in 7 days
  const refreshToken = jwt.sign(
    { id: idString },
    process.env.REFRESH_SECRET,
    { expiresIn: process.env.REFRESH_EXPIRES_IN || "7d" }
  );

  const cookieBase = getCookieOptions();

  // Set access token as HTTP-only cookie
  // httpOnly: true means JavaScript cannot read it
  // secure: true in production means HTTPS only
  res.cookie("token", accessToken, {
    ...cookieBase,
    maxAge: 15 * 60 * 1000,
  });

  // Set refresh token as HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    ...cookieBase,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  // Return the refresh token so we can
  // save it to the database
  return refreshToken;
}

// clearTokens - removes both token cookies
// Called when user clicks the logout button
// After this the user cannot make API requests
// until they login again
function clearTokens(res) {
  const opts = getCookieOptions();
  // Clear the access token cookie
  res.clearCookie("token", opts);
  // Clear the refresh token cookie
  res.clearCookie("refreshToken", opts);
}

module.exports = { sendTokens, clearTokens };
