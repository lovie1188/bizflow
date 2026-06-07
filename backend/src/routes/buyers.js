const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const PDFDocument = require('pdfkit');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest, buyerSchema } = require('../middleware/validate');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// CREATE BUYER
router.post('/', verifyToken, requireRole('admin'), validateRequest(buyerSchema), async (req, res) => {
  const { name, gstin, pan, phone, email, city, state, address, pincode, businessType, msmeNo, msmeType, agreementSigned } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO buyers (
        company_id, name, gstin, pan, phone, email, city, state, 
        address, pincode, business_type, msme_no, msme_type, agreement_signed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *`,
      [req.companyId, name, gstin, pan, phone, email, city, state, address, pincode, businessType, msmeNo, msmeType, agreementSigned]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET BUYERS
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buyers WHERE company_id = $1 ORDER BY created_at DESC', [req.companyId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GENERATE AGREEMENT PDF
router.get('/:id/generate-agreement', verifyToken, async (req, res) => {
  try {
    const buyerRes = await pool.query('SELECT * FROM buyers WHERE id = $1 AND company_id = $2', [req.params.id, req.companyId]);
    if (buyerRes.rows.length === 0) return res.status(404).json({ error: 'Buyer not found' });
    const buyer = buyerRes.rows[0];

    const companyRes = await pool.query('SELECT * FROM companies WHERE id = $1', [req.companyId]);
    const company = companyRes.rows[0];

    const doc = new PDFDocument();
    res.setHeader('Content-disposition', `attachment; filename=Agreement_${buyer.name.replace(/\s+/g, '_')}.pdf`);
    res.setHeader('Content-type', 'application/pdf');
    doc.pipe(res);

    doc.fontSize(18).text('MSME BUYER-SUPPLIER AGREEMENT', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`BETWEEN`);
    doc.moveDown();
    doc.text(`Supplier: ${company.name}`);
    doc.text(`GSTIN: ${company.gstin}`);
    doc.moveDown();
    doc.text(`AND`);
    doc.moveDown();
    doc.text(`Buyer: ${buyer.name}`);
    doc.text(`GSTIN: ${buyer.gstin}`);
    doc.text(`Address: ${buyer.address}, ${buyer.city}, ${buyer.state} - ${buyer.pincode}`);
    doc.moveDown(2);
    
    doc.fontSize(14).text('1. Payment Terms & MSME Compliance');
    doc.fontSize(12).text(`The Buyer shall make payment for goods supplied or services rendered by the Supplier on or before 45 days from the date of acceptance or deemed acceptance of such goods or services, in accordance with the provisions of the Micro, Small and Medium Enterprises Development (MSMED) Act, 2006.`);
    doc.moveDown();
    doc.text(`Notwithstanding anything to the contrary in this Agreement, the payment period shall in no event exceed 45 days from the date of acceptance/deemed acceptance of goods or services, as mandated under Section 15 of the MSMED Act, 2006.`);
    doc.moveDown(2);

    doc.text('Signature of Supplier: ______________________');
    doc.moveDown();
    doc.text('Signature of Buyer: ______________________');

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '../../../uploads/docs');
    const fs = require('fs');
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, 'Agreement_' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// UPLOAD AGREEMENT
router.post('/:id/agreement', verifyToken, upload.single('agreementFile'), async (req, res) => {
  try {
    let agreementUrl = req.body.agreementUrl;
    
    if (req.file) {
      agreementUrl = `/uploads/docs/${req.file.filename}`;
    }

    if (!agreementUrl) {
      return res.status(400).json({ error: 'Please upload an agreement file.' });
    }

    const uploadedAt = new Date().toISOString();
    
    const result = await pool.query(
      'UPDATE buyers SET agreement_url = $1, agreement_signed = true, agreement_uploaded_at = $2, status = $3 WHERE id = $4 RETURNING *',
      [agreementUrl, uploadedAt, 'under_review', req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Buyer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// APPROVE BUYER & SET GRACE PERIOD
router.put('/:id/approve', verifyToken, requireRole('admin'), async (req, res) => {
  const { gracePeriodDays, agreementUrl } = req.body;
  
  try {
    const status = req.body.status || 'approved';
    let query;
    let params;
    
    if (agreementUrl) {
      // Supplier directly uploaded the agreement
      query = 'UPDATE buyers SET status = $1, agreement_url = $2, agreement_signed = true WHERE id = $3 AND company_id = $4 RETURNING *';
      params = [status, agreementUrl, req.params.id, req.companyId];
    } else if (gracePeriodDays > 0) {
      // Provisional Approval with grace period
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(gracePeriodDays));
      query = 'UPDATE buyers SET status = $1, grace_period_days = $2, grace_period_expires_at = $3 WHERE id = $4 AND company_id = $5 RETURNING *';
      params = [status, gracePeriodDays, expiresAt, req.params.id, req.companyId];
    } else {
      // Direct approval/rejection
      query = 'UPDATE buyers SET status = $1 WHERE id = $2 AND company_id = $3 RETURNING *';
      params = [status, req.params.id, req.companyId];
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Buyer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE BUYER CREDIT LIMIT
router.put('/:id/credit', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE buyers SET credit_limit = $1 WHERE id = $2 AND company_id = $3 RETURNING *',
      [req.body.creditLimit, req.params.id, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Buyer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
