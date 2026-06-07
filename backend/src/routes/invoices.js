const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest, invoiceSchema } = require('../middleware/validate');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// CREATE INVOICE
router.post('/', verifyToken, requireRole('admin'), validateRequest(invoiceSchema), async (req, res) => {
  const { orderId, amount, dueDate, buyerEntityId, agreementType } = req.body;
  
  try {
    const invoiceNumber = `INV-${Date.now()}`;
    const irn = Math.random().toString(36).substring(2, 34).toUpperCase(); // Dummy IRN
    
    const result = await pool.query(
      `INSERT INTO invoices (
        company_id, order_id, buyer_entity_id, invoice_number, irn, 
        amount, due_date, agreement_type, msme_protected
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [req.companyId, orderId, buyerEntityId, invoiceNumber, irn, amount, dueDate, agreementType, true]
    );

    // Update order status
    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['dispatched', orderId]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET INVOICES (Paginated)
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // Admin sees all, buyer sees only theirs
    const query = req.role === 'admin'
      ? 'SELECT i.*, o.order_number, o.invoice_url, b.name as buyer_name FROM invoices i LEFT JOIN orders o ON i.order_id = o.id LEFT JOIN buyers b ON i.buyer_entity_id = b.id WHERE i.company_id = $1 ORDER BY i.created_at DESC LIMIT $2 OFFSET $3'
      : 'SELECT i.*, o.order_number, o.invoice_url, b.name as buyer_name FROM invoices i LEFT JOIN orders o ON i.order_id = o.id LEFT JOIN buyers b ON i.buyer_entity_id = b.id WHERE i.company_id = $1 AND o.buyer_id = $2 ORDER BY i.created_at DESC LIMIT $3 OFFSET $4';
    
    const countQuery = req.role === 'admin'
      ? 'SELECT COUNT(*) FROM invoices WHERE company_id = $1'
      : 'SELECT COUNT(*) FROM invoices i LEFT JOIN orders o ON i.order_id = o.id WHERE i.company_id = $1 AND o.buyer_id = $2';
    
    const params = req.role === 'admin' 
      ? [req.companyId, limit, offset] 
      : [req.companyId, req.userId, limit, offset];
      
    const countParams = req.role === 'admin' ? [req.companyId] : [req.companyId, req.userId];
    
    const dataResult = await pool.query(query, params);
    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      data: dataResult.rows,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// MARK INVOICE PAID
router.post('/:id/mark-paid', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE invoices SET paid = true WHERE id = $1 AND company_id = $2 RETURNING *',
      [req.params.id, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET INVOICE PDF (HTML-printable)
router.get('/:id/pdf', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, o.order_number, o.delivery_address, 
              b.name as buyer_name, b.gstin as buyer_gstin, b.address as buyer_address,
              c.name as company_name, c.gstin as company_gstin, c.address as company_address, c.phone as company_phone
       FROM invoices i
       LEFT JOIN orders o ON i.order_id = o.id
       LEFT JOIN buyers b ON i.buyer_entity_id = b.id
       LEFT JOIN companies c ON i.company_id = c.id
       WHERE i.id = $1 AND i.company_id = $2`,
      [req.params.id, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });
    
    const inv = result.rows[0];
    const dueDate = inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : 'N/A';
    const createdDate = new Date(inv.created_at).toLocaleDateString('en-IN');
    const amount = parseFloat(inv.amount || inv.grand_total || 0);

    // Return printable HTML
    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Invoice ${inv.invoice_number}</title>
<style>
  body { font-family: Arial, sans-serif; margin: 40px; color: #111; }
  h1 { color: #1e40af; } 
  table { width: 100%; border-collapse: collapse; margin-top: 20px; }
  th { background: #1e40af; color: white; padding: 10px; text-align: left; }
  td { padding: 10px; border-bottom: 1px solid #eee; }
  .total { font-size: 1.3em; font-weight: bold; color: #1e40af; }
  .flex { display: flex; justify-content: space-between; }
  .box { border: 1px solid #ccc; padding: 16px; border-radius: 8px; width: 45%; }
  @media print { button { display: none; } }
</style>
</head><body>
<button onclick="window.print()" style="margin-bottom:20px;padding:8px 16px;background:#1e40af;color:white;border:none;border-radius:4px;cursor:pointer;">🖨 Print / Save PDF</button>
<h1>TAX INVOICE</h1>
<p><strong>${inv.company_name || 'Supplier'}</strong> | GSTIN: ${inv.company_gstin || 'N/A'} | ${inv.company_address || ''} | ${inv.company_phone || ''}</p>
<hr/>
<div class="flex" style="margin:20px 0;">
  <div class="box">
    <strong>Bill To:</strong><br/>
    ${inv.buyer_name || 'N/A'}<br/>
    GSTIN: ${inv.buyer_gstin || 'N/A'}<br/>
    ${inv.buyer_address || inv.delivery_address || 'N/A'}
  </div>
  <div class="box">
    <strong>Invoice No:</strong> ${inv.invoice_number}<br/>
    <strong>Order Ref:</strong> ${inv.order_number || 'N/A'}<br/>
    <strong>Date:</strong> ${createdDate}<br/>
    <strong>Due Date:</strong> ${dueDate}<br/>
    <strong>Status:</strong> ${inv.paid ? 'PAID' : 'UNPAID'}
  </div>
</div>
<table>
  <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
  <tbody>
    <tr><td>Invoice for Order ${inv.order_number || inv.id}</td><td style="text-align:right">₹${amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
    <tr><td colspan="2" style="text-align:right" class="total">Total: ₹${amount.toLocaleString('en-IN', {minimumFractionDigits:2})}</td></tr>
  </tbody>
</table>
<p style="margin-top:40px;font-size:12px;color:#888;">This is a computer-generated invoice. MSME Buyer-Supplier agreement applies. Payment due within 45 days as per Section 43B(h) of the Income Tax Act.</p>
</body></html>`;

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
