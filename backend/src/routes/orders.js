const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest, orderSchema } = require('../middleware/validate');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const { generatePO, generateInvoice } = require('../utils/pdfGenerator');
const { sendPurchaseOrder } = require('../utils/notifications');

// CREATE ORDER
router.post('/', verifyToken, async (req, res) => {
  const { buyerId, items, dueDate, deliveryAddress, notes, tcSignature } = req.body;
  
  if (!tcSignature || tcSignature.trim() === '') {
    return res.status(400).json({ error: 'Terms and Conditions must be digitally signed to place an order.' });
  }

  try {
    await pool.query('BEGIN');
    
    // Verify buyer approval or grace period
    const buyerRes = await pool.query('SELECT * FROM buyers WHERE id = $1', [buyerId]);
    if (buyerRes.rows.length === 0) throw new Error('Buyer not found');
    const buyer = buyerRes.rows[0];

    const companyRes = await pool.query('SELECT * FROM companies WHERE id = $1', [req.companyId || 1]);
    const supplier = companyRes.rows[0] || { name: 'Supplier', gstin: 'N/A' };

    if (buyer.status !== 'approved') {
      if (!buyer.grace_period_expires_at || new Date() > new Date(buyer.grace_period_expires_at)) {
        throw new Error('Buyer must be approved or within a valid grace period to place an order. Please upload your signed MSME agreement.');
      }
    }
    
    // Calculate totals
    let subtotal = 0;
    let gstAmount = 0;
    
    items.forEach(item => {
      const itemAmount = item.qty * item.unitPrice;
      const itemGst = itemAmount * (item.gstRate / 100);
      subtotal += itemAmount;
      gstAmount += itemGst;
    });
    
    const grandTotal = subtotal + gstAmount;
    const orderNumber = `ORD-${Date.now()}`;
    const tcAcceptedAt = new Date().toISOString();
    
    const orderResult = await pool.query(
      `INSERT INTO orders (
        company_id, order_number, buyer_id, buyer_entity_id, 
        total_amount, subtotal, gst_amount, grand_total, items_count, 
        due_date, delivery_address, notes, tc_signature, tc_accepted_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [
        req.companyId || 1, // fallback to 1 for simplicity if not set
        orderNumber, req.userId, buyerId, grandTotal, subtotal, 
        gstAmount, grandTotal, items.length, dueDate, deliveryAddress, notes, tcSignature, tcAcceptedAt
      ]
    );
    
    const order = orderResult.rows[0];
    const orderId = order.id;
    
    // Insert items
    for (const item of items) {
      const itemAmount = item.qty * item.unitPrice;
      const itemGst = itemAmount * (item.gstRate / 100);
      const itemTotal = itemAmount + itemGst;
      
      await pool.query(
        `INSERT INTO order_items (
          order_id, product_id, qty, unit_price, gst_rate, hsn_code, amount, gst_amount, total
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [orderId, item.productId, item.qty, item.unitPrice, item.gstRate, item.hsnCode, itemAmount, itemGst, itemTotal]
      );
    }

    // Generate PDFs
    const orderDataForPdf = { ...order, items };
    const poUrl = await generatePO(orderDataForPdf, buyer, supplier);
    
    // Generate Invoice Number based on Supplier Prefix
    const prefix = supplier.invoice_prefix || 'INV-2026-';
    const invoiceNumber = `${prefix}${orderId.toString().padStart(4, '0')}`;
    const invoiceUrl = await generateInvoice(orderDataForPdf, buyer, supplier, invoiceNumber);

    // Save URLs to DB
    await pool.query(
      'UPDATE orders SET po_url = $1, invoice_url = $2 WHERE id = $3',
      [poUrl, invoiceUrl, orderId]
    );
    
    await pool.query('COMMIT');
    
    // Send automatic Purchase Order
    sendPurchaseOrder(
      { orderNumber, grandTotal, itemsCount: items.length, dueDate },
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

// UPDATE DELIVERY STATUS
router.put('/:id/delivery', verifyToken, requireRole('admin', 'staff'), async (req, res) => {
  const { delivery_status, tracking_note } = req.body;
  try {
    const orderRes = await pool.query('SELECT delivery_tracking FROM orders WHERE id = $1 AND company_id = $2', [req.params.id, req.companyId]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    let tracking = orderRes.rows[0].delivery_tracking || [];
    if (typeof tracking === 'string') tracking = JSON.parse(tracking);
    
    tracking.push({
      status: delivery_status,
      note: tracking_note,
      timestamp: new Date().toISOString()
    });

    let deliveredAt = null;
    if (delivery_status === 'delivered') {
      deliveredAt = new Date().toISOString();
    }

    const updateQuery = deliveredAt 
      ? 'UPDATE orders SET delivery_status = $1, delivery_tracking = $2, delivered_at = $3 WHERE id = $4 AND company_id = $5 RETURNING *'
      : 'UPDATE orders SET delivery_status = $1, delivery_tracking = $2 WHERE id = $3 AND company_id = $4 RETURNING *';
      
    const params = deliveredAt 
      ? [delivery_status, JSON.stringify(tracking), deliveredAt, req.params.id, req.companyId]
      : [delivery_status, JSON.stringify(tracking), req.params.id, req.companyId];

    const result = await pool.query(updateQuery, params);
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ORDERS (Paginated)
router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const isAdminOrStaff = ['admin', 'staff', 'delivery'].includes(req.role);

    const query = isAdminOrStaff
      ? 'SELECT o.*, u.name as buyer_name FROM orders o LEFT JOIN users u ON o.buyer_id = u.id WHERE o.company_id = $1 ORDER BY o.created_at DESC LIMIT $2 OFFSET $3'
      : 'SELECT o.*, u.name as buyer_name FROM orders o LEFT JOIN users u ON o.buyer_id = u.id WHERE o.company_id = $1 AND o.buyer_id = $2 ORDER BY o.created_at DESC LIMIT $3 OFFSET $4';
    
    const countQuery = isAdminOrStaff
      ? 'SELECT COUNT(*) FROM orders WHERE company_id = $1'
      : 'SELECT COUNT(*) FROM orders WHERE company_id = $1 AND buyer_id = $2';
    
    const params = isAdminOrStaff 
      ? [req.companyId, limit, offset] 
      : [req.companyId, req.userId, limit, offset];
    
    const countParams = isAdminOrStaff ? [req.companyId] : [req.companyId, req.userId];
    
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

// APPROVE/REJECT ORDER
router.put('/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  const { status } = req.body; // approved, rejected, dispatched, delivered
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 AND company_id = $3 RETURNING *',
      [status, req.params.id, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
