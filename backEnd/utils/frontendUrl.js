const AppError = require("./AppError");

/**
 * Public URLs sent to users (invites, password reset) must use FRONTEND_URL only.
 * Set FRONTEND_URL in the environment (see .env.example and render.yaml).
 */
function getFrontendBaseUrl() {
  const raw = (process.env.FRONTEND_URL || "").trim();
  if (!raw) {
    throw new AppError("FRONTEND_URL is not configured. Set it in the environment.", 500);
  }
  return raw.replace(/\/$/, "");
}

module.exports = { getFrontendBaseUrl };
