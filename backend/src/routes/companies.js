const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { verifyToken, requireRole } = require('../middleware/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET COMPANY SETTINGS
router.get('/settings', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM companies WHERE id = $1', [req.companyId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Company not found' });
    
    // Also fetch bank accounts if any (mocked for now, assuming a company_banks table doesn't fully exist yet or isn't used)
    const company = result.rows[0];
    res.json({
      ...company
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put('/settings', verifyToken, requireRole('admin'), async (req, res) => {
  const { 
    name, gstin, udyam_no, phone, email, address, city, state, pincode, invoice_prefix,
    gst_turnover, default_payment_terms, eway_bill_threshold, msme_alert_days 
  } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE companies 
       SET name = COALESCE($1, name),
           gstin = COALESCE($2, gstin),
           udyam_no = COALESCE($3, udyam_no),
           phone = COALESCE($4, phone),
           email = COALESCE($5, email),
           address = COALESCE($6, address),
           city = COALESCE($7, city),
           state = COALESCE($8, state),
           pincode = COALESCE($9, pincode),
           invoice_prefix = COALESCE($10, invoice_prefix),
           gst_turnover = COALESCE($11, gst_turnover),
           default_payment_terms = COALESCE($12, default_payment_terms),
           eway_bill_threshold = COALESCE($13, eway_bill_threshold),
           msme_alert_days = COALESCE($14, msme_alert_days),
           updated_at = NOW()
       WHERE id = $15 RETURNING *`,
      [name, gstin, udyam_no, phone, email, address, city, state, pincode, invoice_prefix, 
       gst_turnover, default_payment_terms, eway_bill_threshold, msme_alert_days, req.companyId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Company not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET COMPANY BANKS
router.get('/banks', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM bank_accounts WHERE company_id = $1 AND active = true ORDER BY is_default DESC, id ASC', [req.companyId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD COMPANY BANK
router.post('/banks', verifyToken, requireRole('admin'), async (req, res) => {
  const { account_name, bank_name, account_no, ifsc, upi_id, owner_name, is_default } = req.body;
  try {
    if (is_default) {
      await pool.query('UPDATE bank_accounts SET is_default = false WHERE company_id = $1', [req.companyId]);
    }
    const result = await pool.query(
      `INSERT INTO bank_accounts (company_id, account_name, bank_name, account_no, ifsc, upi_id, owner_name, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.companyId, account_name, bank_name, account_no, ifsc, upi_id, owner_name, is_default || false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE COMPANY BANK
router.delete('/banks/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('UPDATE bank_accounts SET active = false WHERE id = $1 AND company_id = $2', [req.params.id, req.companyId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
