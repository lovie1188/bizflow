const express = require('express');
const pool = require('../utils/db');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');


// ── GET /api/settings/public ───────────────────────────────────
// Returns global feature flags + pricing (no auth needed — used by frontend)
router.get('/public', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM system_settings');
    const settings = {};
    result.rows.forEach(row => { settings[row.key] = row.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/settings/company-features ────────────────────────
// Returns global flags + this company's subscription status (for admin)
router.get('/company-features', verifyToken, async (req, res) => {
  try {
    const companyId = req.companyId;
    if (!companyId) return res.status(400).json({ error: 'No company associated' });

    const [settingsRes, subRes] = await Promise.all([
      pool.query('SELECT key, value FROM system_settings'),
      pool.query('SELECT feature, status FROM company_subscriptions WHERE company_id = $1', [companyId])
    ]);

    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.key] = r.value; });

    const subs = {};
    subRes.rows.forEach(r => { subs[r.feature] = r.status; });

    const features = ['razorpay', 'whatsapp', 'sms'];
    const result = {};
    features.forEach(f => {
      result[f] = {
        globally_enabled: settings[`${f}_globally_enabled`] === 'true',
        subscribed:       subs[f] === 'active',
        active:           settings[`${f}_globally_enabled`] === 'true' && subs[f] === 'active',
        price_monthly:    parseFloat(settings[`feature_price_${f}`] || 0),
        description:      settings[`feature_desc_${f}`] || '',
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
