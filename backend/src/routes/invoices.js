const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest, invoiceSchema } = require('../middleware/validate');


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
      : 'SELECT i.*, o.order_number, o.invoice_url, b.name as buyer_name FROM invoices i LEFT JOIN orders o ON i.order_id = o.id LEFT JOIN buyers b ON i.buyer_entity_id = b.id WHERE i.buyer_entity_id = $1 ORDER BY i.created_at DESC LIMIT $2 OFFSET $3';
    
    const countQuery = req.role === 'admin'
      ? 'SELECT COUNT(*) FROM invoices WHERE company_id = $1'
      : 'SELECT COUNT(*) FROM invoices WHERE buyer_entity_id = $1';
    
    const params = req.role === 'admin' 
      ? [req.companyId, limit, offset] 
      : [req.buyerEntityId, limit, offset];
      
    const countParams = req.role === 'admin' ? [req.companyId] : [req.buyerEntityId];
    
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

    // Release buyer's used_credit when admin manually marks invoice as paid
    const inv = result.rows[0];
    if (inv.buyer_entity_id && inv.amount) {
      await pool.query(
        'UPDATE buyers SET used_credit = GREATEST(used_credit - $1, 0) WHERE id = $2',
        [parseFloat(inv.amount), inv.buyer_entity_id]
      );
    }

    res.json(inv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET INVOICE PDF (HTML-printable — GST Compliant with Line Items)
router.get('/:id/pdf', verifyToken, async (req, res) => {
  try {
    const isAdmin = req.role === 'admin';
    const query = isAdmin
      ? `SELECT i.*, o.order_number, o.delivery_address, o.tc_signature,
              b.name as buyer_name, b.gstin as buyer_gstin, b.address as buyer_address, b.city as buyer_city, b.state as buyer_state, b.pincode as buyer_pincode,
              c.name as company_name, c.gstin as company_gstin, c.address as company_address, c.phone as company_phone, c.city as company_city, c.state as company_state, c.invoice_prefix
         FROM invoices i
         LEFT JOIN orders o ON i.order_id = o.id
         LEFT JOIN buyers b ON i.buyer_entity_id = b.id
         LEFT JOIN companies c ON i.company_id = c.id
         WHERE i.id = $1 AND i.company_id = $2`
      : `SELECT i.*, o.order_number, o.delivery_address,
              b.name as buyer_name, b.gstin as buyer_gstin, b.address as buyer_address, b.city as buyer_city, b.state as buyer_state, b.pincode as buyer_pincode,
              c.name as company_name, c.gstin as company_gstin, c.address as company_address, c.phone as company_phone, c.city as company_city, c.state as company_state
         FROM invoices i
         LEFT JOIN orders o ON i.order_id = o.id
         LEFT JOIN buyers b ON i.buyer_entity_id = b.id
         LEFT JOIN companies c ON i.company_id = c.id
         WHERE i.id = $1 AND i.buyer_entity_id = $2`;

    const params = isAdmin ? [req.params.id, req.companyId] : [req.params.id, req.buyerEntityId];
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Invoice not found' });

    const inv = result.rows[0];

    // Fetch order line items
    const itemsRes = await pool.query(
      `SELECT oi.*, p.name as product_name, p.hsn_code
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1
       ORDER BY oi.id ASC`,
      [inv.order_id]
    );
    const items = itemsRes.rows;

    const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'N/A';

    const amount     = parseFloat(inv.amount || 0);
    const taxable    = parseFloat(inv.taxable_amount || 0);
    const gstTotal   = parseFloat(inv.gst_amount || 0);
    const cgst       = gstTotal / 2;
    const sgst       = gstTotal / 2;

    const itemRows = items.map((item, i) => {
      const itemGst    = parseFloat(item.gst_amount || 0);
      const itemCgst   = itemGst / 2;
      const itemSgst   = itemGst / 2;
      return `
        <tr>
          <td>${i + 1}</td>
          <td>${item.product_name || item.name || '—'}</td>
          <td class="c">${item.hsn_code || '—'}</td>
          <td class="c">${Number(item.qty).toFixed(2)}</td>
          <td class="r">₹${fmt(item.unit_price)}</td>
          <td class="r">₹${fmt(item.amount)}</td>
          <td class="c">${item.gst_rate || 0}%</td>
          <td class="r">₹${fmt(itemCgst)}</td>
          <td class="r">₹${fmt(itemSgst)}</td>
          <td class="r"><strong>₹${fmt(item.total)}</strong></td>
        </tr>`;
    }).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tax Invoice — ${inv.invoice_number}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Segoe UI',Arial,sans-serif; font-size:12px; color:#111; background:#f4f6f8; padding:16px; }
    .page { background:#fff; max-width:960px; margin:0 auto; border-radius:6px; box-shadow:0 2px 16px rgba(0,0,0,.1); overflow:hidden; }
    .hdr { background:#1e40af; color:#fff; padding:16px 20px; display:flex; justify-content:space-between; align-items:flex-start; }
    .hdr h1 { font-size:22px; font-weight:700; letter-spacing:.5px; }
    .hdr p  { font-size:11px; opacity:.85; margin-top:2px; }
    .hdr-right { text-align:right; }
    .hdr-right .inv-no { font-size:18px; font-weight:700; }
    .badge { display:inline-block; background:rgba(255,255,255,.2); border:1px solid rgba(255,255,255,.5); border-radius:4px; padding:2px 8px; font-size:10px; margin-top:5px; }
    .body { padding:16px 20px; }
    .parties { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px; }
    .card { border:1px solid #e0e0e0; border-radius:6px; padding:10px 12px; background:#fafafa; }
    .card h3 { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.8px; color:#1e40af; margin-bottom:7px; padding-bottom:4px; border-bottom:1px solid #e0e0e0; }
    .card .lbl { font-size:9.5px; color:#888; text-transform:uppercase; letter-spacing:.4px; }
    .card .val { font-size:12px; font-weight:600; }
    .card .val.sm { font-size:11px; font-weight:400; }
    .sec-title { font-size:11px; font-weight:700; color:#1e40af; text-transform:uppercase; letter-spacing:.6px; margin-bottom:6px; padding-bottom:3px; border-bottom:2px solid #1e40af; }
    table { width:100%; border-collapse:collapse; margin-bottom:14px; font-size:11px; }
    thead tr { background:#1e40af; color:#fff; }
    thead th { padding:6px 7px; text-align:left; font-weight:600; font-size:10.5px; text-transform:uppercase; letter-spacing:.3px; }
    tbody tr:nth-child(even) { background:#f0f4ff; }
    tbody td { padding:5px 7px; border-bottom:1px solid #eee; vertical-align:middle; }
    .c { text-align:center; }
    .r { text-align:right; }
    .totals-wrap { display:flex; justify-content:flex-end; margin-bottom:14px; }
    .totals { width:300px; border:1px solid #e0e0e0; border-radius:6px; overflow:hidden; }
    .trow { display:flex; justify-content:space-between; padding:5px 12px; font-size:11.5px; border-bottom:1px solid #eee; }
    .trow:last-child { border-bottom:none; }
    .trow.grand { background:#1e40af; color:#fff; font-weight:700; font-size:13px; }
    .trow .tl { color:#555; }
    .trow.grand .tl { color:rgba(255,255,255,.85); }
    .notes-box { background:#fffbea; border-left:3px solid #f0b429; border-radius:0 4px 4px 0; padding:8px 12px; margin-bottom:14px; }
    .footer { background:#eff6ff; border-top:2px solid #1e40af; padding:8px 20px; text-align:center; font-size:9.5px; color:#666; }
    .print-btn { display:flex; gap:8px; justify-content:flex-end; max-width:960px; margin:0 auto 12px; }
    .print-btn button { padding:7px 16px; border-radius:6px; font-size:12px; font-weight:600; cursor:pointer; }
    .btn-p { background:#1e40af; color:#fff; border:none; }
    .btn-s { background:#fff; color:#1e40af; border:1.5px solid #1e40af; }
    @media print { body{background:#fff;padding:0;} .page{box-shadow:none;border-radius:0;} .print-btn{display:none;} }
  </style>
</head>
<body>
  <div class="print-btn">
    <button class="btn-s" onclick="window.close()">✕ Close</button>
    <button class="btn-p" onclick="window.print()">🖨 Print / Save PDF</button>
  </div>
  <div class="page">
    <div class="hdr">
      <div>
        <h1>TAX INVOICE</h1>
        <p>${inv.company_name || 'Supplier'}</p>
        <p>GSTIN: ${inv.company_gstin || 'N/A'} &nbsp;|&nbsp; ${inv.company_address || ''}, ${inv.company_city || ''}, ${inv.company_state || ''}</p>
        <p>Ph: ${inv.company_phone || 'N/A'}</p>
        <span class="badge">MSME Compliant — 45 Days Payment Window</span>
      </div>
      <div class="hdr-right">
        <div class="inv-no">${inv.invoice_number}</div>
        <div style="font-size:11px;opacity:.85;margin-top:3px;">Date: ${fmtDate(inv.created_at)}</div>
        <div style="font-size:11px;opacity:.85;">Due: ${fmtDate(inv.due_date)}</div>
        <div style="font-size:11px;opacity:.85;">Status: ${inv.paid ? '✅ PAID' : '⚠️ UNPAID'}</div>
      </div>
    </div>

    <div class="body">
      <div class="parties">
        <div class="card">
          <h3>Bill To (Buyer)</h3>
          <div class="lbl">Name</div><div class="val">${inv.buyer_name || '—'}</div>
          <div class="lbl" style="margin-top:4px">GSTIN</div><div class="val sm">${inv.buyer_gstin || 'Not Provided'}</div>
          <div class="lbl" style="margin-top:4px">Address</div>
          <div class="val sm">${inv.buyer_address || inv.delivery_address || '—'}, ${inv.buyer_city || ''} ${inv.buyer_pincode || ''}</div>
        </div>
        <div class="card">
          <h3>Order Reference</h3>
          <div class="lbl">Order No.</div><div class="val">${inv.order_number || '—'}</div>
          <div class="lbl" style="margin-top:4px">Invoice No.</div><div class="val">${inv.invoice_number}</div>
          <div class="lbl" style="margin-top:4px">Invoice Date</div><div class="val sm">${fmtDate(inv.created_at)}</div>
          <div class="lbl" style="margin-top:4px">Due Date</div><div class="val sm">${fmtDate(inv.due_date)}</div>
        </div>
      </div>

      <div class="sec-title">Itemised Bill — GST Breakup</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product / Description</th>
            <th class="c">HSN</th>
            <th class="c">Qty</th>
            <th class="r">Rate</th>
            <th class="r">Taxable Amt</th>
            <th class="c">GST%</th>
            <th class="r">CGST</th>
            <th class="r">SGST</th>
            <th class="r">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows || `<tr><td colspan="10" class="c" style="padding:12px;color:#888;">No line items found</td></tr>`}
        </tbody>
      </table>

      <div class="totals-wrap">
        <div class="totals">
          <div class="trow"><span class="tl">Taxable Amount</span><span>₹${fmt(taxable)}</span></div>
          <div class="trow"><span class="tl">CGST</span><span>₹${fmt(cgst)}</span></div>
          <div class="trow"><span class="tl">SGST</span><span>₹${fmt(sgst)}</span></div>
          <div class="trow grand"><span class="tl">Grand Total</span><span>₹${fmt(amount)}</span></div>
        </div>
      </div>

      ${inv.tc_signature ? `
      <div class="notes-box">
        <div style="font-size:10.5px;font-weight:700;color:#b7791f;text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px;">Digitally Accepted</div>
        <p style="font-size:11.5px;color:#444;">Terms & Conditions accepted by: "${inv.tc_signature}"</p>
      </div>` : ''}

      <p style="font-size:10.5px;color:#888;margin-top:8px;">
        This is a system-generated Tax Invoice. MSME Buyer-Supplier agreement applies.
        Payment due within 45 days as per Section 43B(h) of the Income Tax Act.
        IRN Status: ${inv.irn_status || 'Pending'} | IRN: ${inv.irn || 'Not Generated'}
      </p>
    </div>

    <div class="footer">
      ${inv.company_name || 'Supplier'} &nbsp;|&nbsp; GSTIN: ${inv.company_gstin || 'N/A'} &nbsp;|&nbsp; Invoice: ${inv.invoice_number} &nbsp;|&nbsp; Generated: ${new Date().toLocaleString('en-IN')}
    </div>
  </div>
</body>
</html>`;

    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
