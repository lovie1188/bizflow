// File path: backend/src/routes/orders.js
const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest, orderSchema } = require('../middleware/validate');


const { generatePO, generateInvoice, renderPOHtml } = require('../utils/pdfGenerator');
const { sendPurchaseOrder } = require('../utils/notifications');

// // ─────────────────────────────────────────────
// CREATE ORDER
// ─────────────────────────────────────────────
router.post('/', verifyToken, validateRequest(orderSchema), async (req, res) => {
  const { buyerId, items, dueDate, deliveryAddress, notes, tcSignature, saveAddressToProfile } = req.body;

  if (!tcSignature || tcSignature.trim() === '') {
    return res.status(400).json({ error: 'Terms and Conditions must be digitally signed to place an order.' });
  }

  try {
    await pool.query('BEGIN');

    // Verify buyer
    const buyerRes = await pool.query('SELECT * FROM buyers WHERE id = $1', [buyerId]);
    if (buyerRes.rows.length === 0) throw new Error('Buyer not found');
    const buyer = buyerRes.rows[0];

    const companyId = req.companyId || buyer.company_id;
    if (!companyId) return res.status(400).json({ error: 'Company ID is required' });
    const companyRes = await pool.query('SELECT * FROM companies WHERE id = $1', [companyId]);
    const supplier = companyRes.rows[0] || { name: 'Supplier', gstin: 'N/A' };

    if (buyer.status !== 'approved') {
      if (!buyer.grace_period_expires_at || new Date() > new Date(buyer.grace_period_expires_at)) {
        throw new Error('Buyer must be approved or within a valid grace period to place an order. Please upload your signed MSME agreement.');
      }
    }

    // Verify prices & stock
    let subtotal = 0;
    let gstAmount = 0;
    const verifiedItems = [];

    for (const item of items) {
      const prodRes = await pool.query(
        'SELECT name, trade_price, gst_rate, hsn_code, stock FROM products WHERE id = $1 AND company_id = $2',
        [item.productId, companyId]
      );
      if (prodRes.rows.length === 0) throw new Error(`Product not found.`);
      const product = prodRes.rows[0];

      if (product.stock < item.qty) {
        throw new Error(`Insufficient stock for ${product.name}. Requested: ${item.qty}, Available: ${product.stock}`);
      }

      const unitPrice = Number(product.trade_price);
      const gstRate = Number(product.gst_rate) || 0;
      const itemAmount = item.qty * unitPrice;
      const itemGst = itemAmount * (gstRate / 100);

      subtotal += itemAmount;
      gstAmount += itemGst;

      verifiedItems.push({
        ...item,
        unitPrice,
        gstRate,
        hsnCode: product.hsn_code || '0000',
        name: product.name
      });
    }

    const grandTotal = subtotal + gstAmount;

    // Enforce credit limit
    const availableCredit = Number(buyer.credit_limit) - Number(buyer.used_credit);
    if (grandTotal > availableCredit) {
      throw new Error(`Order amount (₹${grandTotal.toFixed(2)}) exceeds available credit (₹${availableCredit.toFixed(2)}). Please contact your supplier to increase your limit.`);
    }

    const orderNumber = `ORD-${Date.now()}`;
    const tcAcceptedAt = new Date().toISOString();

    const orderResult = await pool.query(
      `INSERT INTO orders (
        company_id, order_number, buyer_id, buyer_entity_id,
        total_amount, subtotal, gst_amount, grand_total, items_count,
        due_date, delivery_address, notes, tc_signature, tc_accepted_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [
        companyId,
        orderNumber, req.userId, buyerId,
        grandTotal, subtotal, gstAmount, grandTotal, verifiedItems.length,
        dueDate, deliveryAddress, notes, tcSignature, tcAcceptedAt
      ]
    );

    const order = orderResult.rows[0];
    const orderId = order.id;

    // Insert items & deduct stock
    for (const item of verifiedItems) {
      const itemAmount = item.qty * item.unitPrice;
      const itemGst = itemAmount * (item.gstRate / 100);
      const itemTotal = itemAmount + itemGst;

      await pool.query(
        `INSERT INTO order_items (order_id, product_id, qty, unit_price, gst_rate, hsn_code, amount, gst_amount, total)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [orderId, item.productId, item.qty, item.unitPrice, item.gstRate, item.hsnCode, itemAmount, itemGst, itemTotal]
      );

      await pool.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.qty, item.productId]);

      // Low-stock alert — notify admin if stock falls below min_order_qty
      const stockRes = await pool.query('SELECT name, stock, min_order_qty FROM products WHERE id = $1', [item.productId]);
      if (stockRes.rows.length > 0) {
        const p = stockRes.rows[0];
        const remaining = (p.stock || 0) - item.qty;
        const minQty = p.min_order_qty || 1;
        if (remaining <= minQty) {
          const { sendEmail } = require('../utils/notifications');
          const companyRes = await pool.query('SELECT email, name FROM companies WHERE id = $1', [companyId]);
          if (companyRes.rows[0]?.email) {
            const emailHtml = `
              <div style="font-family:Arial,sans-serif;padding:16px;max-width:500px;border:2px solid #f59e0b;border-radius:8px;">
                <h3 style="color:#d97706;margin:0 0 8px;">⚠️ Low Stock Alert</h3>
                <p><strong>${p.name}</strong> has only <strong>${remaining} units</strong> remaining in stock.</p>
                <p>Minimum Order Quantity: ${minQty}</p>
                <p>Please restock to avoid order fulfillment issues.</p>
                <p style="color:#888;font-size:12px;">— BizFlow Auto Alert</p>
              </div>`;
            sendEmail(companyRes.rows[0].email, `⚠️ Low Stock: ${p.name} (${remaining} units left)`, emailHtml)
              .catch(e => console.error('[Low Stock Alert] Email failed:', e.message));
          }
        }
      }
    }

    // Generate URL-based references (no file writing)
    const orderDataForPdf = { ...order, items: verifiedItems };
    const poUrl = await generatePO(orderDataForPdf, buyer, supplier);

    const prefix = supplier.invoice_prefix || 'CM-2026-';
    const invoiceNumber = `${prefix}${orderId.toString().padStart(4, '0')}`;
    const invoiceUrl = await generateInvoice(orderDataForPdf, buyer, supplier, invoiceNumber);

    // Save URLs
    await pool.query('UPDATE orders SET po_url = $1, invoice_url = $2 WHERE id = $3', [poUrl, invoiceUrl, orderId]);

    // Create invoice record
    await pool.query(
      `INSERT INTO invoices (company_id, order_id, buyer_entity_id, invoice_number, amount, taxable_amount, gst_amount, due_date, msme_protected)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [companyId, orderId, buyerId, invoiceNumber, grandTotal, subtotal, gstAmount, dueDate, true]
    );

    // Deduct credit
    await pool.query('UPDATE buyers SET used_credit = used_credit + $1 WHERE id = $2', [grandTotal, buyerId]);

    if (saveAddressToProfile) {
      await pool.query('UPDATE buyers SET address = $1 WHERE id = $2', [deliveryAddress, buyerId]);
    }

    await pool.query('COMMIT');

    sendPurchaseOrder(
      { orderNumber, grandTotal, itemsCount: verifiedItems.length, dueDate },
      buyer.email,
      buyer.phone
    ).catch(e => console.error('Failed to send PO async', e));

    order.po_url = poUrl;
    order.invoice_url = invoiceUrl;

    res.status(201).json(order);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET PO HTML (printable — admin & buyer)
// ─────────────────────────────────────────────
router.get('/:id/po-html', verifyToken, async (req, res) => {
  try {
    const isAdmin = ['admin', 'staff'].includes(req.role);

    // Fetch order with multi-tenant security
    const orderQuery = isAdmin
      ? 'SELECT * FROM orders WHERE id = $1 AND company_id = $2'
      : 'SELECT * FROM orders WHERE id = $1 AND buyer_entity_id = $2';
    const orderParams = isAdmin
      ? [req.params.id, req.companyId]
      : [req.params.id, req.buyerEntityId];

    const orderRes = await pool.query(orderQuery, orderParams);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderRes.rows[0];

    // Fetch order items
    const itemsRes = await pool.query(
      `SELECT oi.*, p.name, p.hsn_code FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1`,
      [order.id]
    );

    // Fetch buyer
    const buyerRes = await pool.query('SELECT * FROM buyers WHERE id = $1', [order.buyer_entity_id]);
    const buyer = buyerRes.rows[0] || {};

    // Fetch supplier
    const supplierRes = await pool.query('SELECT * FROM companies WHERE id = $1', [order.company_id]);
    const supplier = supplierRes.rows[0] || {};

    const html = renderPOHtml({
      order,
      buyer,
      supplier,
      items: itemsRes.rows
    });

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET PO — legacy redirect to po-html
// ─────────────────────────────────────────────
router.get('/:id/po', verifyToken, async (req, res) => {
  res.redirect(`/api/orders/${req.params.id}/po-html`);
});

// ─────────────────────────────────────────────
// GET INVOICE HTML (printable — admin & buyer)
// ─────────────────────────────────────────────
router.get('/:id/invoice-html', verifyToken, async (req, res) => {
  try {
    const invRes = await pool.query('SELECT id FROM invoices WHERE order_id = $1', [req.params.id]);
    if (invRes.rows.length === 0) return res.status(404).send('Invoice not generated for this order yet.');
    res.redirect(`/api/invoices/${invRes.rows[0].id}/pdf`);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

router.get('/:id/invoice', verifyToken, async (req, res) => {
  res.redirect(`/api/orders/${req.params.id}/invoice-html`);
});

// ─────────────────────────────────────────────
// UPDATE DELIVERY STATUS
// ─────────────────────────────────────────────
router.put('/:id/delivery', verifyToken, requireRole('admin', 'staff', 'delivery'), async (req, res) => {
  const { delivery_status, tracking_note } = req.body;
  try {
    const orderRes = await pool.query(
      'SELECT delivery_tracking, status FROM orders WHERE id = $1 AND company_id = $2',
      [req.params.id, req.companyId]
    );
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });

    let tracking = orderRes.rows[0].delivery_tracking || [];
    if (typeof tracking === 'string') tracking = JSON.parse(tracking);

    tracking.push({
      status: delivery_status,
      note: tracking_note,
      timestamp: new Date().toISOString(),
      updated_by: req.userId
    });

    let deliveredAt = null;
    let dispatchDate = null;
    if (delivery_status === 'delivered') deliveredAt = new Date().toISOString();
    if (delivery_status === 'dispatched') dispatchDate = new Date().toISOString().split('T')[0];

    let updateQuery, params;
    if (deliveredAt) {
      updateQuery = 'UPDATE orders SET status=$1, delivery_status=$1, delivery_tracking=$2, delivered_at=$3 WHERE id=$4 AND company_id=$5 RETURNING *';
      params = [delivery_status, JSON.stringify(tracking), deliveredAt, req.params.id, req.companyId];
    } else if (dispatchDate) {
      updateQuery = 'UPDATE orders SET status=$1, delivery_status=$1, delivery_tracking=$2, dispatch_date=$3 WHERE id=$4 AND company_id=$5 RETURNING *';
      params = [delivery_status, JSON.stringify(tracking), dispatchDate, req.params.id, req.companyId];
    } else {
      updateQuery = 'UPDATE orders SET status=$1, delivery_status=$1, delivery_tracking=$2 WHERE id=$3 AND company_id=$4 RETURNING *';
      params = [delivery_status, JSON.stringify(tracking), req.params.id, req.companyId];
    }

    const result = await pool.query(updateQuery, params);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// GET ORDERS (Paginated)
// ─────────────────────────────────────────────
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const isAdminOrStaff = ['admin', 'staff', 'delivery'].includes(req.role);

    const query = isAdminOrStaff
      ? 'SELECT o.*, u.name as buyer_name FROM orders o LEFT JOIN users u ON o.buyer_id = u.id WHERE o.company_id = $1 ORDER BY o.created_at DESC LIMIT $2 OFFSET $3'
      : 'SELECT o.*, u.name as buyer_name FROM orders o LEFT JOIN users u ON o.buyer_id = u.id WHERE o.buyer_entity_id = $1 ORDER BY o.created_at DESC LIMIT $2 OFFSET $3';

    const countQuery = isAdminOrStaff
      ? 'SELECT COUNT(*) FROM orders WHERE company_id = $1'
      : 'SELECT COUNT(*) FROM orders WHERE buyer_entity_id = $1';

    const params = isAdminOrStaff ? [req.companyId, limit, offset] : [req.buyerEntityId, limit, offset];
    const countParams = isAdminOrStaff ? [req.companyId] : [req.buyerEntityId];

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

// ─────────────────────────────────────────────
// APPROVE / REJECT ORDER
// ─────────────────────────────────────────────
router.put('/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  const { status } = req.body;
  try {
    const orderRes = await pool.query(
      'SELECT status, grand_total, buyer_entity_id FROM orders WHERE id = $1 AND company_id = $2',
      [req.params.id, req.companyId]
    );
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    const order = orderRes.rows[0];

    if (['rejected', 'cancelled'].includes(status) && !['rejected', 'cancelled'].includes(order.status)) {
      await pool.query('UPDATE buyers SET used_credit = used_credit - $1 WHERE id = $2', [order.grand_total, order.buyer_entity_id]);
      const itemsRes = await pool.query('SELECT product_id, qty FROM order_items WHERE order_id = $1', [req.params.id]);
      for (const item of itemsRes.rows) {
        await pool.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.qty, item.product_id]);
      }
    }

    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 AND company_id = $3 RETURNING *',
      [status, req.params.id, req.companyId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;