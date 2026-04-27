// securityLog.js
// Writes security-related events to the console as structured JSON.
// Used to track important security events like:
//   - Rate limit hits (too many requests from one IP)
//   - 401 Unauthorized responses (bad or missing token)
//   - 403 Forbidden responses (wrong role)
//   - CSP violation reports from the browser
//
// HOW TO USE:
//   const { logEvent } = require("../helpers/securityLog");
//   logEvent("rate_limit_auth", req, { window: "15m" });
//
// OUTPUT FORMAT (written to console as a warning):
//   [security] {"tag":"rate_limit_auth","requestId":"abc123","ip":"1.2.3.4","path":"/api/users/login","method":"POST","window":"15m"}

// logEvent - logs one security event as a JSON line
// tag    - short label for the type of event (e.g. "rate_limit_auth")
// req    - the Express request object (used to get IP, path, method)
// extra  - optional object with any additional details to include
function logEvent(tag, req, extra) {
  const id = req.id || "";
  const ip = req.ip || "";
  const line = { tag, requestId: id, ip, path: req.path, method: req.method, ...extra };
  console.warn("[security]", JSON.stringify(line));
}

module.exports = { logEvent };
