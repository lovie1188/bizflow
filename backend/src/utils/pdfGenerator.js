// File path: backend/src/utils/pdfGenerator.js
// Generates HTML-based PO and Invoice documents.
// Returns a URL path string (stored in po_url / invoice_url).
// The actual HTML is rendered on-demand via GET /:id/po-html and GET /:id/invoice-html routes.

/**
 * generatePO
 * Called during order creation. Stores the URL path in the DB.
 * @returns {string} URL path like /api/orders/42/po-html
 */
async function generatePO(order, buyer, supplier) {
  return `/api/orders/${order.id}/po-html`;
}

/**
 * generateInvoice
 * Called during order creation. Stores the URL path in the DB.
 * @returns {string} URL path like /api/orders/42/invoice-html
 */
async function generateInvoice(order, buyer, supplier, invoiceNumber) {
  return `/api/orders/${order.id}/invoice-html`;
}

/**
 * renderPOHtml
 * Renders the full printable PO HTML given order data.
 * Called by the GET /:id/po-html route.
 */
function renderPOHtml({ order, buyer, supplier, items }) {
  const formatDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatCurrency = (n) =>
    Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const itemRows = items.map((item, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.name || '—'}</td>
      <td class="center">${item.hsn_code || item.hsnCode || '—'}</td>
      <td class="center">${Number(item.qty).toFixed(2)}</td>
      <td class="right">₹${formatCurrency(item.unit_price || item.unitPrice)}</td>
      <td class="center">${item.gst_rate || item.gstRate || 0}%</td>
      <td class="right">₹${formatCurrency(item.amount || (item.qty * (item.unit_price || item.unitPrice)))}</td>
      <td class="right">₹${formatCurrency(item.gst_amount || item.gstAmount)}</td>
      <td class="right">₹${formatCurrency(item.total || item.itemTotal)}</td>
    </tr>
  `).join('');

  const subtotal = Number(order.subtotal || 0);
  const gstAmount = Number(order.gst_amount || 0);
  const grandTotal = Number(order.grand_total || order.total_amount || 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Purchase Order — ${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 12px;
      color: #1a1a1a;
      background: #f4f6f8;
      padding: 16px;
    }

    .page {
      background: #fff;
      max-width: 900px;
      margin: 0 auto;
      border-radius: 6px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.10);
      overflow: hidden;
    }

    /* ── HEADER ── */
    .header {
      background: #02B290;
      color: #fff;
      padding: 16px 20px 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .header-left h1 {
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header-left p {
      font-size: 11px;
      opacity: 0.85;
      margin-top: 3px;
    }
    .header-right {
      text-align: right;
    }
    .header-right .po-number {
      font-size: 16px;
      font-weight: 700;
    }
    .header-right .po-date {
      font-size: 11px;
      opacity: 0.85;
      margin-top: 3px;
    }
    .msme-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      border: 1px solid rgba(255,255,255,0.5);
      border-radius: 4px;
      padding: 2px 8px;
      font-size: 10px;
      margin-top: 6px;
      letter-spacing: 0.4px;
    }

    /* ── BODY ── */
    .body { padding: 16px 20px; }

    /* ── PARTIES GRID ── */
    .parties {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    .party-card {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 10px 12px;
      background: #fafafa;
    }
    .party-card h3 {
      font-size: 10.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      color: #02B290;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #e0e0e0;
    }
    .party-card .field { margin-bottom: 4px; }
    .party-card .label {
      font-size: 9.5px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .party-card .value {
      font-size: 12px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .party-card .value.small { font-size: 11px; font-weight: 400; }

    /* ── TERMS ROW ── */
    .terms-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-bottom: 16px;
    }
    .term-box {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 8px 12px;
      background: #fafafa;
    }
    .term-box .label {
      font-size: 9.5px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
    }
    .term-box .value {
      font-size: 12px;
      font-weight: 600;
      color: #1a1a1a;
    }

    /* ── ITEMS TABLE ── */
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #02B290;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 8px;
      padding-bottom: 3px;
      border-bottom: 2px solid #02B290;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    thead tr {
      background: #02B290;
      color: #fff;
    }
    thead th {
      padding: 6px 8px;
      font-size: 10.5px;
      font-weight: 600;
      text-align: left;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    thead th.center { text-align: center; }
    thead th.right { text-align: right; }
    tbody tr:nth-child(even) { background: #f7fffe; }
    tbody tr:hover { background: #e8f8f5; }
    tbody td {
      padding: 6px 8px;
      font-size: 11.5px;
      border-bottom: 1px solid #eee;
      vertical-align: middle;
    }
    tbody td.center { text-align: center; }
    tbody td.right { text-align: right; }

    /* ── TOTALS ── */
    .totals-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .totals-box {
      width: 280px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      overflow: hidden;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 11.5px;
      border-bottom: 1px solid #eee;
    }
    .totals-row:last-child { border-bottom: none; }
    .totals-row.grand {
      background: #02B290;
      color: #fff;
      font-size: 13px;
      font-weight: 700;
    }
    .totals-row .tl { color: #555; }
    .totals-row.grand .tl { color: rgba(255,255,255,0.85); }

    /* ── CLAUSES ── */
    .clauses {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 16px;
    }
    .clause {
      border-left: 3px solid #02B290;
      padding: 6px 10px;
      background: #f7fffe;
      border-radius: 0 4px 4px 0;
    }
    .clause .clause-title {
      font-size: 10.5px;
      font-weight: 700;
      color: #02B290;
      text-transform: uppercase;
      letter-spacing: 0.4px;
      margin-bottom: 2px;
    }
    .clause p {
      font-size: 10.5px;
      color: #444;
      line-height: 1.4;
    }

    /* ── SIGNATURES ── */
    .signatures {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-top: 4px;
    }
    .sig-box {
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .sig-box .sig-label {
      font-size: 10.5px;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 30px;
    }
    .sig-box .sig-name {
      border-top: 1.5px solid #aaa;
      padding-top: 4px;
      font-size: 11.5px;
      font-weight: 600;
      color: #1a1a1a;
    }
    .sig-box .sig-sub {
      font-size: 9.5px;
      color: #888;
      margin-top: 2px;
    }
    .digital-sig {
      font-size: 10.5px;
      color: #02B290;
      font-style: italic;
      margin-top: 3px;
    }

    /* ── FOOTER ── */
    .footer {
      background: #f0faf7;
      border-top: 2px solid #02B290;
      padding: 8px 20px;
      text-align: center;
      font-size: 9.5px;
      color: #888;
      letter-spacing: 0.3px;
    }

    /* ── PRINT ── */
    .print-btn {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      margin-bottom: 12px;
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
    }
    .print-btn button {
      background: #02B290;
      color: #fff;
      border: none;
      padding: 7px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .print-btn button:hover { background: #019a7a; }
    .print-btn button.secondary {
      background: #fff;
      color: #02B290;
      border: 1.5px solid #02B290;
    }
    .print-btn button.secondary:hover { background: #f0faf7; }

    @media print {
      body { background: #fff; padding: 0; }
      .page { box-shadow: none; border-radius: 0; }
      .print-btn { display: none; }
    }
  </style>
</head>
<body>

  <div class="print-btn">
    <button class="secondary" onclick="window.close()">✕ Close</button>
    <button onclick="window.print()">🖨 Print / Save PDF</button>
  </div>

  <div class="page">

    <!-- HEADER -->
    <div class="header">
      <div class="header-left">
        <h1>${supplier.name || 'Charu Marketing'}</h1>
        <p>${supplier.address || ''}, ${supplier.city || ''}, ${supplier.state || ''}</p>
        <p>GSTIN: ${supplier.gstin || '—'} &nbsp;|&nbsp; Ph: ${supplier.phone || '—'}</p>
        <span class="msme-badge">MSME Compliant Purchase Order</span>
      </div>
      <div class="header-right">
        <div class="po-number">PO: ${order.order_number}</div>
        <div class="po-date">Date: ${formatDate(order.created_at)}</div>
        ${order.due_date ? `<div class="po-date">Due: ${formatDate(order.due_date)}</div>` : ''}
      </div>
    </div>

    <div class="body">

      <!-- PARTIES -->
      <div class="parties">
        <div class="party-card">
          <h3>Buyer Details</h3>
          <div class="field">
            <div class="label">Name</div>
            <div class="value">${buyer.name || '—'}</div>
          </div>
          <div class="field">
            <div class="label">GSTIN</div>
            <div class="value small">${buyer.gstin || 'Not Provided'}</div>
          </div>
          <div class="field">
            <div class="label">Address</div>
            <div class="value small">${buyer.address || '—'}, ${buyer.city || ''} ${buyer.pincode || ''}</div>
          </div>
          <div class="field">
            <div class="label">Contact</div>
            <div class="value small">${buyer.phone || '—'} ${buyer.email ? '| ' + buyer.email : ''}</div>
          </div>
          ${buyer.msme_no ? `<div class="field"><div class="label">MSME / Udyam No.</div><div class="value small">${buyer.msme_no}</div></div>` : ''}
        </div>

        <div class="party-card">
          <h3>Supplier (MSME) Details</h3>
          <div class="field">
            <div class="label">Name</div>
            <div class="value">${supplier.name || '—'}</div>
          </div>
          <div class="field">
            <div class="label">GSTIN</div>
            <div class="value small">${supplier.gstin || '—'}</div>
          </div>
          <div class="field">
            <div class="label">Address</div>
            <div class="value small">${supplier.address || '—'}, ${supplier.city || ''}, ${supplier.state || ''}</div>
          </div>
          <div class="field">
            <div class="label">Contact</div>
            <div class="value small">${supplier.phone || '—'}</div>
          </div>
          ${supplier.udyam_no ? `<div class="field"><div class="label">Udyam No.</div><div class="value small">${supplier.udyam_no}</div></div>` : ''}
        </div>
      </div>

      <!-- DELIVERY TERMS ROW -->
      <div class="terms-row" style="margin-bottom:24px;">
        <div class="term-box">
          <div class="label">Delivery Address</div>
          <div class="value" style="font-size:12px;font-weight:400;">${order.delivery_address || buyer.address || '—'}</div>
        </div>
        <div class="term-box">
          <div class="label">Payment Terms</div>
          <div class="value">${supplier.default_payment_terms || 'As per MSME Act'}</div>
        </div>
        <div class="term-box">
          <div class="label">Delivery Date</div>
          <div class="value">${formatDate(order.due_date)}</div>
        </div>
      </div>

      <!-- ITEMS TABLE -->
      <div class="section-title">Order Items</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Product Name</th>
            <th class="center">HSN</th>
            <th class="center">Qty</th>
            <th class="right">Rate</th>
            <th class="center">GST%</th>
            <th class="right">Taxable Amt</th>
            <th class="right">GST Amt</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>

      <!-- TOTALS -->
      <div class="totals-wrapper">
        <div class="totals-box">
          <div class="totals-row">
            <span class="tl">Subtotal (Taxable)</span>
            <span>₹${formatCurrency(subtotal)}</span>
          </div>
          <div class="totals-row">
            <span class="tl">GST Amount</span>
            <span>₹${formatCurrency(gstAmount)}</span>
          </div>
          <div class="totals-row grand">
            <span class="tl">Grand Total</span>
            <span>₹${formatCurrency(grandTotal)}</span>
          </div>
        </div>
      </div>

      <!-- CLAUSES -->
      <div class="section-title">Terms & Conditions</div>
      <div class="clauses">
        <div class="clause">
          <div class="clause-title">Validity & Shelf Life</div>
          <p>Products must have minimum 5–6 days shelf life at delivery. Perishable goods as per FSSAI standards.</p>
        </div>
        <div class="clause">
          <div class="clause-title">Inspection</div>
          <p>Buyer must inspect within same day / 24 hours of delivery. Complaints after 24 hours will not be entertained.</p>
        </div>
        <div class="clause">
          <div class="clause-title">Risk & Liability</div>
          <p>Before delivery: supplier liable. After delivery & acceptance: buyer liable for goods.</p>
        </div>
        <div class="clause">
          <div class="clause-title">Replacement</div>
          <p>Defective / damaged goods must be reported within 24 hours. Replacement within 48 hours of approval.</p>
        </div>
        <div class="clause">
          <div class="clause-title">Payment Terms</div>
          <p>Payment within ${supplier.default_payment_terms || '15 days'}. Delay interest as per MSME Act 2006 (3x RBI rate).</p>
        </div>
        <div class="clause">
          <div class="clause-title">Dispute Resolution</div>
          <p>Disputes resolved through MSE Facilitation Council as per MSMED Act 2006. Jurisdiction: Jodhpur, Rajasthan.</p>
        </div>
      </div>

      ${order.notes ? `
      <div style="margin-bottom:20px; padding:12px 14px; background:#fffbea; border-left:3px solid #f0b429; border-radius:0 4px 4px 0;">
        <div style="font-size:11px;font-weight:700;color:#b7791f;text-transform:uppercase;letter-spacing:0.4px;margin-bottom:4px;">Notes</div>
        <p style="font-size:12px;color:#444;">${order.notes}</p>
      </div>` : ''}

      <!-- SIGNATURES -->
      <div class="signatures">
        <div class="sig-box">
          <div class="sig-label">Buyer Signature & Stamp</div>
          ${order.tc_signature ? `<div class="digital-sig">✓ Digitally signed: "${order.tc_signature}"</div>` : ''}
          <div class="sig-name">${buyer.name || '—'}</div>
          <div class="sig-sub">${formatDate(order.tc_accepted_at || order.created_at)}</div>
        </div>
        <div class="sig-box">
          <div class="sig-label">Supplier Signature & Stamp</div>
          <div class="sig-name">${supplier.name || '—'}</div>
          <div class="sig-sub">Authorised Signatory</div>
        </div>
      </div>

    </div><!-- /body -->

    <div class="footer">
      This is a system-generated Purchase Order from BizFlow India &nbsp;|&nbsp;
      GSTIN: ${supplier.gstin || '—'} &nbsp;|&nbsp;
      ${supplier.msme_alert_days || 'MSME Protected — 45 Days'} &nbsp;|&nbsp;
      Generated: ${new Date().toLocaleString('en-IN')}
    </div>

  </div><!-- /page -->

</body>
</html>`;
}

module.exports = { generatePO, generateInvoice, renderPOHtml };