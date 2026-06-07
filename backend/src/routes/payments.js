const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { verifyToken, requireRole } = require('../middleware/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// PAYMENT WEBHOOK (Razorpay)
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const crypto = require('crypto');
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body.toString();

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(body)
    .digest('hex');

  if (signature === expectedSignature) {
    const { payload } = JSON.parse(body);
    const invoiceId = payload.payment.entity.notes.invoice_id;
    try {
      await pool.query('UPDATE invoices SET paid = true WHERE id = $1', [invoiceId]);
      res.json({ status: 'success' });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});

// GET PAYMENT HISTORY
router.get('/', verifyToken, async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT p.*, i.invoice_number, b.name AS buyer_name
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       LEFT JOIN buyers   b ON i.buyer_entity_id = b.id
       WHERE p.company_id = $1
       ORDER BY p.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.companyId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM payments WHERE company_id = $1',
      [req.companyId]
    );

    res.json({
      data: result.rows,
      pagination: {
        page, limit,
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RECORD OFFLINE PAYMENT (cash / bank transfer / cheque)
router.post('/record', verifyToken, requireRole('admin'), async (req, res) => {
  const { invoiceId, amount, paymentMethod, transactionId } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO payments (company_id, invoice_id, amount, payment_method, transaction_id, status)
       VALUES ($1, $2, $3, $4, $5, 'completed') RETURNING *`,
      [req.companyId, invoiceId, amount, paymentMethod || 'cash', transactionId || null]
    );

    // Auto-mark invoice as paid
    await pool.query('UPDATE invoices SET paid = true WHERE id = $1', [invoiceId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

