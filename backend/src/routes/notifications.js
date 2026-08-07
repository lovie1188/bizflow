const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');


// GET: Fetch all notifications
router.get('/', verifyToken, requireRole('admin', 'staff', 'developer'), async (req, res, next) => {
  try {
    let query, params;
    
    if (req.role === 'developer') {
      query = `SELECT n.id, n.invoice_id, n.type, n.day_trigger, n.sent_at, n.status,
                      i.invoice_number, i.amount, c.name as company_name
               FROM notifications n
               LEFT JOIN invoices i ON n.invoice_id = i.id
               LEFT JOIN companies c ON n.company_id = c.id
               ORDER BY n.sent_at DESC NULLS FIRST, n.id DESC LIMIT 100`;
      params = [];
    } else {
      query = `SELECT n.id, n.invoice_id, n.type, n.day_trigger, n.sent_at, n.status,
                      i.invoice_number, i.amount, b.name as buyer_name
               FROM notifications n
               LEFT JOIN invoices i ON n.invoice_id = i.id
               LEFT JOIN buyers b ON i.buyer_entity_id = b.id
               WHERE n.company_id = $1
               ORDER BY n.sent_at DESC NULLS FIRST, n.id DESC`;
      params = [req.companyId];
    }
    
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
