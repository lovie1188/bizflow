const express = require('express');
const pool = require('../utils/db');
const router  = express.Router();
const { verifyToken } = require('../middleware/auth');


// ── GET /api/subscriptions/my ──────────────────────────────────
// Admin: fetch own company's subscription statuses for all features
router.get('/my', verifyToken, async (req, res) => {
  try {
    const companyId = req.companyId;
    if (!companyId) return res.status(400).json({ error: 'No company associated with this account' });

    // Get all subscriptions for this company
    const subRes = await pool.query(
      `SELECT feature, status, activated_at, expires_at, price_monthly, notes
       FROM company_subscriptions WHERE company_id = $1`,
      [companyId]
    );

    // Get global settings + pricing
    const settingsRes = await pool.query(
      `SELECT key, value FROM system_settings WHERE key LIKE '%globally_enabled' OR key LIKE 'feature_price_%' OR key LIKE 'feature_desc_%' OR key = 'developer_upi'`
    );
    const settings = {};
    settingsRes.rows.forEach(r => { settings[r.key] = r.value; });

    // Build a structured response per feature
    const features = ['razorpay', 'whatsapp', 'sms'];
    const result = {
      platform: {
        developer_upi: settings['developer_upi'] || null,
      }
    };
    
    features.forEach(f => {
      const sub = subRes.rows.find(r => r.feature === f) || {};
      result[f] = {
        globally_enabled: settings[`${f}_globally_enabled`] === 'true',
        status:           sub.status || 'inactive',
        activated_at:     sub.activated_at || null,
        expires_at:       sub.expires_at   || null,
        price_monthly:    sub.price_monthly || parseFloat(settings[`feature_price_${f}`] || 0),
        description:      settings[`feature_desc_${f}`] || '',
      };
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/subscriptions/all ─────────────────────────────────
// Developer: all companies with their subscription statuses
router.get('/all', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  try {
    const result = await pool.query(`
      SELECT
        c.id AS company_id,
        c.name AS company_name,
        cs.feature,
        cs.status,
        cs.activated_at,
        cs.expires_at,
        cs.price_monthly,
        cs.notes,
        u.email AS activated_by_email
      FROM companies c
      LEFT JOIN company_subscriptions cs ON cs.company_id = c.id
      LEFT JOIN users u ON u.id = cs.activated_by
      ORDER BY c.name, cs.feature
    `);

    // Group by company
    const companies = {};
    result.rows.forEach(row => {
      if (!companies[row.company_id]) {
        companies[row.company_id] = { id: row.company_id, name: row.company_name, subscriptions: {} };
      }
      if (row.feature) {
        companies[row.company_id].subscriptions[row.feature] = {
          status:       row.status,
          activated_at: row.activated_at,
          expires_at:   row.expires_at,
          price_monthly: row.price_monthly,
          notes:        row.notes,
          activated_by: row.activated_by_email,
        };
      }
    });

    res.json({ success: true, companies: Object.values(companies) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/subscriptions/activate ──────────────────────────
// Developer: activate a feature for a company
router.post('/activate', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  try {
    const { company_id, feature, expires_at, price_monthly, notes } = req.body;
    if (!company_id || !feature) return res.status(400).json({ error: 'company_id and feature are required' });

    await pool.query(`
      INSERT INTO company_subscriptions (company_id, feature, status, activated_by, activated_at, expires_at, price_monthly, notes)
      VALUES ($1, $2, 'active', $3, NOW(), $4, $5, $6)
      ON CONFLICT (company_id, feature)
      DO UPDATE SET status = 'active', activated_by = $3, activated_at = NOW(), expires_at = $4, price_monthly = $5, notes = $6, created_at = company_subscriptions.created_at
    `, [company_id, feature, req.userId, expires_at || null, price_monthly || null, notes || null]);

    res.json({ success: true, message: `${feature} activated for company ${company_id}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/subscriptions/deactivate ────────────────────────
// Developer: deactivate a feature for a company
router.post('/deactivate', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  try {
    const { company_id, feature } = req.body;
    if (!company_id || !feature) return res.status(400).json({ error: 'company_id and feature are required' });

    await pool.query(`
      UPDATE company_subscriptions SET status = 'inactive'
      WHERE company_id = $1 AND feature = $2
    `, [company_id, feature]);

    res.json({ success: true, message: `${feature} deactivated for company ${company_id}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
