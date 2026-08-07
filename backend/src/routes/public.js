const express = require('express');
const pool = require('../utils/db');
const router = express.Router();


// Helper to get company by name (case-insensitive)
const getCompanyByName = async (name) => {
  const res = await pool.query(
    'SELECT id, name, email, phone FROM companies WHERE LOWER(name) = LOWER($1)',
    [name]
  );
  return res.rows[0];
};

// ── GET /api/public/store/:storeName ──────────────────────────────
router.get('/store/:storeName', async (req, res) => {
  try {
    const company = await getCompanyByName(req.params.storeName);
    if (!company) {
      return res.status(404).json({ error: 'Store not found' });
    }
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/public/store/:storeName/products ─────────────────────
router.get('/store/:storeName/products', async (req, res) => {
  try {
    const company = await getCompanyByName(req.params.storeName);
    if (!company) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, sku, name, hsn_code, gst_rate, unit, trade_price, stock, min_order_qty, image_url, category, brand 
       FROM products 
       WHERE company_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [company.id, limit, offset]
    );

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM products WHERE company_id = $1',
      [company.id]
    );
    const total = parseInt(countRes.rows[0].count, 10);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to get company by custom domain
const getCompanyByDomain = async (domain) => {
  const res = await pool.query(
    'SELECT id, name, email, phone, custom_domain FROM companies WHERE LOWER(custom_domain) = LOWER($1)',
    [domain]
  );
  return res.rows[0];
};

// ── GET /api/public/domain/:hostname ──────────────────────────────
router.get('/domain/:hostname', async (req, res) => {
  try {
    const company = await getCompanyByDomain(req.params.hostname);
    if (!company) {
      return res.status(404).json({ error: 'Domain not mapped to any store' });
    }
    res.json({ success: true, company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/public/domain/:hostname/products ─────────────────────
router.get('/domain/:hostname/products', async (req, res) => {
  try {
    const company = await getCompanyByDomain(req.params.hostname);
    if (!company) {
      return res.status(404).json({ error: 'Domain not mapped to any store' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT id, sku, name, hsn_code, gst_rate, unit, trade_price, stock, min_order_qty, image_url, category, brand 
       FROM products 
       WHERE company_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [company.id, limit, offset]
    );

    const countRes = await pool.query(
      'SELECT COUNT(*) FROM products WHERE company_id = $1',
      [company.id]
    );
    const total = parseInt(countRes.rows[0].count, 10);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
        hasNext: offset + limit < total
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
