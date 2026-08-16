const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');


// GET DASHBOARD DATA
router.get('/', verifyToken, async (req, res) => {
  try {
    const cid = req.companyId;

    // Run all queries in parallel for speed
    const [
      ordersResult,
      invoicesResult,
      buyersResult,
      productsResult,
      paidRevenueResult
    ] = await Promise.all([
      pool.query(
        `SELECT o.*, b.name AS buyer_name
         FROM orders o
         LEFT JOIN buyers b ON o.buyer_entity_id = b.id
         WHERE o.company_id = $1
         ORDER BY o.created_at DESC LIMIT 10`,
        [cid]
      ),
      pool.query(
        `SELECT i.*, b.name AS buyer_name
         FROM invoices i
         LEFT JOIN buyers b ON i.buyer_entity_id = b.id
         WHERE i.company_id = $1 AND i.paid = false`,
        [cid]
      ),
      pool.query('SELECT COUNT(*) FROM buyers WHERE company_id = $1', [cid]),
      pool.query('SELECT COUNT(*) FROM products WHERE company_id = $1', [cid]),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total
         FROM invoices
         WHERE company_id = $1 AND paid = true
         AND created_at >= date_trunc('month', NOW())`,
        [cid]
      )
    ]);

    const invoices = invoicesResult.rows;
    const totalOutstanding = invoices.reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

    // Compute 45-day aging buckets server-side
    const today = new Date();
    let aging = { safe: 0, monitor: 0, warning: 0, critical: 0 };
    invoices.forEach(inv => {
      // MSMED Act: 45-day clock runs from due_date (acceptance date), not invoice creation date
      const reference = inv.due_date ? new Date(inv.due_date) : new Date(inv.created_at);
      const days = Math.floor((today - reference) / (1000 * 60 * 60 * 24));
      const amt = parseFloat(inv.amount || 0);
      if (days <= 0)  aging.safe += amt;      // not yet due
      else if (days <= 15) aging.monitor += amt;
      else if (days <= 30) aging.warning += amt;
      else aging.critical += amt;
    });

    res.json({
      orders: ordersResult.rows,
      invoices,
      totalOutstanding,
      unpaidCount: invoices.length,
      totalBuyers: parseInt(buyersResult.rows[0].count),
      totalProducts: parseInt(productsResult.rows[0].count),
      revenueThisMonth: parseFloat(paidRevenueResult.rows[0].total),
      aging
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
