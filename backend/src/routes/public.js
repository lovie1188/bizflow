const express = require('express');
const pool = require('../utils/db');
const router = express.Router();


// Helper to get company by store_slug (preferred) or company name (fallback)
const getCompanyByName = async (name) => {
  const res = await pool.query(
    `SELECT id, name, email, phone, store_slug, custom_domain 
     FROM companies 
     WHERE LOWER(store_slug) = LOWER($1) OR LOWER(name) = LOWER($1)
     LIMIT 1`,
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

// ── GET /api/public/suppliers ─────────────────────────────────────
// Returns all active supplier companies for the marketplace directory
router.get('/suppliers', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.id, c.name, c.store_slug, c.custom_domain,
              COUNT(p.id)::int AS product_count
       FROM companies c
       LEFT JOIN products p ON p.company_id = c.id
       GROUP BY c.id
       ORDER BY c.name ASC`
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/public/marketplace/products ──────────────────────────
// Aggregated product catalog across ALL suppliers — for the /marketplace page
// Supports: ?page, ?limit, ?search, ?category, ?supplier_id
router.get('/marketplace/products', async (req, res) => {
  try {
    const { page = 1, limit = 24, search = '', category = '', supplier_id = '' } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(p.name ILIKE $${params.length} OR p.brand ILIKE $${params.length} OR p.category ILIKE $${params.length})`);
    }
    if (category) {
      params.push(category);
      conditions.push(`p.category = $${params.length}`);
    }
    if (supplier_id) {
      params.push(Number(supplier_id));
      conditions.push(`p.company_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count query
    const countRes = await pool.query(
      `SELECT COUNT(*) FROM products p ${where}`,
      params
    );
    const total = parseInt(countRes.rows[0].count, 10);

    // Data query — join with company for supplier info on each product
    const dataParams = [...params, Number(limit), offset];
    const result = await pool.query(
      `SELECT p.id, p.sku, p.name, p.hsn_code, p.gst_rate, p.unit,
              p.trade_price, p.stock, p.min_order_qty, p.image_url,
              p.category, p.brand,
              c.id AS supplier_id, c.name AS supplier_name, c.store_slug AS supplier_slug
       FROM products p
       JOIN companies c ON c.id = p.company_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
      dataParams
    );

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
        hasNext: offset + Number(limit) < total
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

