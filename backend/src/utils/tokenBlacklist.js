// backend/src/utils/tokenBlacklist.js
// H-3: Token Blacklist / Invalidation Cache
// Stores invalidated JWT signatures or tokens until their natural expiry to prevent reused stolen tokens.

const revokedTokens = new Map(); // tokenString -> expiryTimestampMs

// Periodic cleanup of expired tokens every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [token, exp] of revokedTokens.entries()) {
    if (exp <= now) {
      revokedTokens.delete(token);
    }
  }
}, 30 * 60 * 1000).unref();

/**
 * Revoke/blacklist a JWT token until its expiration time
 * @param {string} token - Raw JWT token string
 * @param {number} [expiresInSeconds=86400*14] - Token expiry in seconds
 */
const revokeToken = (token, expiresInSeconds = 14 * 86400) => {
  if (!token) return;
  const expiryTime = Date.now() + (expiresInSeconds * 1000);
  revokedTokens.set(token, expiryTime);
};

/**
 * Check if a token has been revoked
 * @param {string} token
 * @returns {boolean}
 */
const isTokenRevoked = (token) => {
  if (!token) return false;
  const exp = revokedTokens.get(token);
  if (!exp) return false;
  if (exp <= Date.now()) {
    revokedTokens.delete(token);
    return false;
  }
  return true;
};

module.exports = {
  revokeToken,
  isTokenRevoked
};
