/**
 * Feature Catalog + Client Feature Toggles
 *
 * GET  /api/features/catalog                    — all catalog entries (developer)
 * PUT  /api/features/catalog/:key               — update catalog entry (developer)
 * GET  /api/features/client/:companyId          — per-client toggle state (developer | admin read-only)
 * POST /api/features/client/:companyId/toggle   — live enable/disable (developer only)
 * GET  /api/features/quotation/:companyId       — compute costing + quotation summary (developer)
 */

const express = require('express');
const router  = express.Router();
const pool    = require('../utils/db');
const { verifyToken } = require('../middleware/auth');

const COMPLEXITY_MULTIPLIER = { simple: 1.0, medium: 1.3, complex: 1.6 };

// ── GET /api/features/catalog ──────────────────────────────────────
router.get('/catalog', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  try {
    const result = await pool.query(
      'SELECT * FROM feature_catalog ORDER BY display_order, category, name'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── PUT /api/features/catalog/:key ────────────────────────────────
router.put('/catalog/:key', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  const { default_hours, hourly_rate, complexity, recurring_monthly_cost, billing_type, description } = req.body;
  try {
    const result = await pool.query(`
      UPDATE feature_catalog SET
        default_hours          = COALESCE($1, default_hours),
        hourly_rate            = COALESCE($2, hourly_rate),
        complexity             = COALESCE($3, complexity),
        recurring_monthly_cost = COALESCE($4, recurring_monthly_cost),
        billing_type           = COALESCE($5, billing_type),
        description            = COALESCE($6, description)
      WHERE key = $7 RETURNING *`,
      [default_hours, hourly_rate, complexity, recurring_monthly_cost, billing_type, description, req.params.key]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Feature not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/features/client/:companyId ───────────────────────────
router.get('/client/:companyId', verifyToken, async (req, res) => {
  // Developer sees any company; admin can only read their own
  if (req.role !== 'developer' && String(req.companyId) !== String(req.params.companyId)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  try {
    const result = await pool.query(`
      SELECT fc.*,
             COALESCE(cf.enabled, true)      AS enabled,
             cf.override_price,
             cf.billing_status,
             cf.notes,
             cf.updated_at
      FROM feature_catalog fc
      LEFT JOIN client_features cf
             ON cf.feature_key = fc.key AND cf.company_id = $1
      ORDER BY fc.display_order, fc.category, fc.name`,
      [req.params.companyId]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /api/features/client/:companyId/toggle ───────────────────
// Live mode: writes to client_features — immediately affects the running app
router.post('/client/:companyId/toggle', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });

  const { feature_key, enabled, override_price, billing_status, notes } = req.body;
  if (!feature_key) return res.status(400).json({ error: 'feature_key is required' });

  try {
    await pool.query(`
      INSERT INTO client_features
             (company_id, feature_key, enabled, override_price, billing_status, notes, updated_by, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (company_id, feature_key)
      DO UPDATE SET
        enabled        = EXCLUDED.enabled,
        override_price = EXCLUDED.override_price,
        billing_status = EXCLUDED.billing_status,
        notes          = EXCLUDED.notes,
        updated_by     = EXCLUDED.updated_by,
        updated_at     = NOW()`,
      [
        req.params.companyId, feature_key,
        enabled ?? true,
        override_price ?? null,
        billing_status ?? 'charged',
        notes ?? null,
        req.userId
      ]
    );
    res.json({
      success: true,
      message: `'${feature_key}' ${enabled ? 'enabled' : 'disabled'} for company ${req.params.companyId}`
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /api/features/quotation/:companyId ────────────────────────
// Returns full costing breakdown for Developer Dashboard Costing tab
router.get('/quotation/:companyId', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });

  const hourlyRate = parseFloat(req.query.hourlyRate) || 400;

  try {
    const [catalogRes, companyRes] = await Promise.all([
      pool.query(`
        SELECT fc.*,
               COALESCE(cf.enabled, true) AS is_enabled,
               cf.override_price,
               cf.billing_status
        FROM feature_catalog fc
        LEFT JOIN client_features cf
               ON cf.feature_key = fc.key AND cf.company_id = $1
        ORDER BY fc.display_order, fc.category`,
        [req.params.companyId]
      ),
      pool.query('SELECT id, name FROM companies WHERE id = $1', [req.params.companyId])
    ]);

    if (!companyRes.rows.length) return res.status(404).json({ error: 'Company not found' });

    let oneTimeCost      = 0;
    let monthlyRecurring = 0;
    let yearlyRecurring  = 0;

    const features = catalogRes.rows.map(f => {
      const m    = COMPLEXITY_MULTIPLIER[f.complexity] || 1.0;
      let cost   = 0;

      if (f.override_price !== null && f.override_price !== undefined) {
        cost = parseFloat(f.override_price);
      } else if (f.billing_type === 'one_time') {
        cost = (parseFloat(f.default_hours) || 0) * hourlyRate * m;
      } else if (f.billing_type === 'recurring_monthly') {
        cost = parseFloat(f.recurring_monthly_cost) || 0;
      } else if (f.billing_type === 'recurring_yearly') {
        cost = parseFloat(f.recurring_monthly_cost) || 0; // stored as annual amount
      }
      // percentage_per_transaction: cost = 0, shown as note

      if (f.is_enabled) {
        if (f.billing_type === 'one_time')           oneTimeCost      += cost;
        if (f.billing_type === 'recurring_monthly')  monthlyRecurring += cost;
        if (f.billing_type === 'recurring_yearly')   yearlyRecurring  += cost;
      }

      return { ...f, computed_cost: Math.round(cost) };
    });

    // AMC = 18% of one-time build cost (India freelance/agency standard)
    const amc = Math.round(oneTimeCost * 0.18);
    yearlyRecurring += amc;

    res.json({
      success: true,
      company:     companyRes.rows[0].name,
      company_id:  req.params.companyId,
      hourly_rate: hourlyRate,
      features,
      summary: {
        one_time_build:    Math.round(oneTimeCost),
        monthly_recurring: Math.round(monthlyRecurring),
        yearly_recurring:  Math.round(yearlyRecurring),
        amc_18_percent:    amc,
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
