/**
 * featureGate(featureKey)
 * Middleware factory — blocks route if feature is disabled for this company.
 *
 * - No client_features row → default ALLOW (feature not explicitly disabled)
 * - enabled: false row → 403 with clear error message
 * - DB error → fail OPEN (don't block legitimate requests on infra failure)
 *
 * Usage:
 *   const featureGate = require('../middleware/featureGate');
 *   router.post('/create-order', verifyToken, featureGate('razorpay'), handler);
 */

const pool = require('../utils/db');

const featureGate = (featureKey) => async (req, res, next) => {
  try {
    const companyId = req.companyId;
    if (!companyId) return next(); // developer role / no company context → allow

    const result = await pool.query(
      'SELECT enabled FROM client_features WHERE company_id = $1 AND feature_key = $2',
      [companyId, featureKey]
    );

    // No row = not explicitly configured → default allow
    if (!result.rows.length) return next();

    if (!result.rows[0].enabled) {
      return res.status(403).json({
        error: 'This feature is not included in your current plan. Please contact your service provider.',
        feature: featureKey,
        code:    'FEATURE_DISABLED'
      });
    }

    next();
  } catch (err) {
    console.error(`[featureGate] Error checking '${featureKey}':`, err.message);
    next(); // fail open — infrastructure error should not block business operations
  }
};

module.exports = featureGate;
