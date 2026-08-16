const jwt = require('jsonwebtoken');
const { isTokenRevoked } = require('../utils/tokenBlacklist');

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.query.token;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  
  if (isTokenRevoked(token)) {
    return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    req.role = decoded.role;
    req.companyId = decoded.companyId;
    req.buyerEntityId = decoded.buyerEntityId;
    req.token = token; // attach token for logout revocation
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.role)) {
      return res.status(403).json({ error: `Forbidden: requires one of [${roles.join(', ')}] role` });
    }
    next();
  };
};

const requireAdmin = requireRole('admin');

module.exports = {
  verifyToken,
  requireRole,
  requireAdmin
};
