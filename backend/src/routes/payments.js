const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const featureGate = require('../middleware/featureGate');
const Razorpay = require('razorpay');

// CREATE RAZORPAY ORDER — blocked if 'razorpay' feature disabled for this company
router.post('/create-order', verifyToken, featureGate('razorpay'), async (req, res) => {
  const { invoiceId } = req.body;
  try {
    const isAdmin = ['admin', 'supplier'].includes(req.role);
    const invoiceQuery = isAdmin
      ? 'SELECT amount, grand_total, company_id FROM invoices WHERE id = $1 AND company_id = $2'
      : 'SELECT amount, grand_total, company_id FROM invoices WHERE id = $1 AND buyer_entity_id = $2';
    const invoiceParams = isAdmin ? [invoiceId, req.companyId] : [invoiceId, req.buyerEntityId];

    const invoiceRes = await pool.query(invoiceQuery, invoiceParams);
    if (invoiceRes.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    
    const amount = parseFloat(invoiceRes.rows[0].grand_total || invoiceRes.rows[0].amount || 0) * 100; // in paise

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY,
      key_secret: process.env.RAZORPAY_SECRET
    });

    const options = {
      amount: Math.round(amount),
      currency: "INR",
      receipt: `receipt_inv_${invoiceId}`,
      notes: {
        invoice_id: String(invoiceId),
        company_id: String(invoiceRes.rows[0].company_id)
      }
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PAYMENT WEBHOOK (Razorpay)
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const crypto = require('crypto');
  const signature = req.headers['x-razorpay-signature'];
  const body = req.body.toString();

  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_SECRET)
    .update(body)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { event, payload } = parsed;

  // Only process actual captured payments — ignore all other event types
  if (event !== 'payment.captured') {
    return res.json({ status: 'ignored', event });
  }

  // Guard against malformed payload shapes
  if (!payload?.payment?.entity?.notes?.invoice_id) {
    console.error('[Webhook] Missing invoice_id in payload notes:', JSON.stringify(payload));
    return res.status(400).json({ error: 'Missing invoice_id in payload' });
  }

  const invoiceId = payload.payment.entity.notes.invoice_id;
  const capturedPaise = payload.payment.entity.amount;

  try {
    // Check invoice exists and is unpaid
    const checkRes = await pool.query(
      'SELECT id, amount, grand_total, paid, buyer_entity_id FROM invoices WHERE id = $1',
      [invoiceId]
    );

    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const inv = checkRes.rows[0];
    if (inv.paid) {
      return res.json({ status: 'already_paid' });
    }

    const expectedPaise = Math.round(parseFloat(inv.grand_total || inv.amount || 0) * 100);
    if (capturedPaise < expectedPaise) {
      console.error(`[Webhook] Insufficient payment amount for invoice ${invoiceId}: captured ${capturedPaise}, expected ${expectedPaise}`);
      return res.status(400).json({ error: 'Payment amount mismatch' });
    }

    const invRes = await pool.query(
      'UPDATE invoices SET paid = true WHERE id = $1 AND paid = false RETURNING buyer_entity_id, grand_total, amount',
      [invoiceId]
    );

    if (invRes.rows.length > 0) {
      const paidInv = invRes.rows[0];
      const paidAmount = parseFloat(paidInv.grand_total || paidInv.amount || 0);
      await pool.query('UPDATE buyers SET used_credit = GREATEST(used_credit - $1, 0) WHERE id = $2', [paidAmount, paidInv.buyer_entity_id]);
    }
    res.json({ status: 'success' });
  } catch (err) {
    console.error('[Webhook] DB error:', err.message);
    res.status(500).json({ error: err.message });
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

    // Auto-mark invoice as paid and release credit limit
    const invRes = await pool.query('UPDATE invoices SET paid = true WHERE id = $1 RETURNING buyer_entity_id', [invoiceId]);
    if (invRes.rows.length > 0) {
      await pool.query('UPDATE buyers SET used_credit = GREATEST(used_credit - $1, 0) WHERE id = $2', [amount, invRes.rows[0].buyer_entity_id]);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;

