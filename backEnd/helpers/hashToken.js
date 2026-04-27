// hashToken.js
// Hashes tokens before storing in database.
//
// We never store raw tokens in the database.
// Instead we store a hashed version.
//
// WHY WE HASH TOKENS:
// If the database is ever hacked the
// attacker gets hashed tokens not raw ones.
// Hashed tokens are useless without
// the original raw token.
//
// Used for:
// - Password reset tokens
// - Invite tokens
//
// We use SHA256 hashing algorithm.

const crypto = require("crypto");

// hashToken - converts a raw token string to a SHA256 hash
// token - the raw token string to hash
// Returns the hashed version as a hexadecimal string
function hashToken(token) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

module.exports = { hashToken };
