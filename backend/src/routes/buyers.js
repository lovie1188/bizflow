const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const PDFDocument = require('pdfkit');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest, buyerSchema } = require('../middleware/validate');
const { uploadToDrive, getOrCreateFolder } = require('../utils/googleDriveService');


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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query('SELECT * FROM buyers WHERE company_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3', [req.companyId, limit, offset]);
    const countResult = await pool.query('SELECT COUNT(*) FROM buyers WHERE company_id = $1', [req.companyId]);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: offset + result.rows.length < total
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET MY BUYER PROFILE (for logged-in buyer user)
router.get('/me', verifyToken, async (req, res) => {
  try {
    // Get user record
    const userRes = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const { email, name } = userRes.rows[0];

    // Try to find matching buyer entity
    const result = await pool.query('SELECT * FROM buyers WHERE email = $1 LIMIT 1', [email]);

    if (result.rows.length === 0) {
      // No buyer entity yet — return basic user data so the profile page still works
      return res.json({ id: null, name, email, status: 'pending', _noBuyerProfile: true });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET SINGLE BUYER
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM buyers WHERE id = $1 AND company_id = $2', [req.params.id, req.companyId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Buyer not found' });
    res.json(result.rows[0]);
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

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// UPLOAD AGREEMENT
router.post('/:id/agreement', verifyToken, upload.single('agreementFile'), async (req, res) => {
  try {
    // IDOR Check: Ensure user is admin of the buyer's company or the buyer uploading for themselves
    if (req.role === 'admin') {
      const checkRes = await pool.query('SELECT id FROM buyers WHERE id = $1 AND company_id = $2', [req.params.id, req.companyId]);
      if (checkRes.rows.length === 0) {
        return res.status(403).json({ error: 'Forbidden: Access denied for this buyer' });
      }
    } else if (Number(req.buyerEntityId) !== Number(req.params.id)) {
      return res.status(403).json({ error: 'Forbidden: You can only upload an agreement for your own account' });
    }

    let agreementUrl = req.body.agreementUrl;
    
    if (req.file) {
      try {
        const buyerRes = await pool.query(`
          SELECT b.name as buyer_name, c.name as admin_company_name 
          FROM buyers b 
          JOIN companies c ON b.company_id = c.id 
          WHERE b.id = $1
        `, [req.params.id]);
        
        const buyerInfo = buyerRes.rows[0];
        const adminCompanyName = buyerInfo?.admin_company_name || 'Supplier';
        const buyerCompanyName = buyerInfo?.buyer_name || `Buyer_${req.params.id}`;
        
        const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
        
        const companyFolderId = await getOrCreateFolder(adminCompanyName, rootFolderId);
        const thisBuyerFolderId = await getOrCreateFolder(buyerCompanyName, companyFolderId);
        const agreementsFolderId = await getOrCreateFolder('Agreement', thisBuyerFolderId);

        const fileName = `Agreement_${req.params.id}_${Date.now()}${path.extname(req.file.originalname)}`;
        agreementUrl = await uploadToDrive(req.file.buffer, fileName, req.file.mimetype, agreementsFolderId);
      } catch (uploadError) {
        console.error('Agreement Upload Error:', uploadError);
        return res.status(500).json({ error: 'Failed to upload agreement to Google Drive' });
      }
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

// UPDATE BUYER ADDRESS
router.put('/:id', verifyToken, async (req, res) => {
  const { address, city, state, pincode } = req.body;
  try {
    // IDOR Check: Ensure buyer is only updating their own profile, or user is admin
    if (req.role !== 'admin' && Number(req.buyerEntityId) !== Number(req.params.id)) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
    }

    const result = await pool.query(
      `UPDATE buyers SET address = $1, city = $2, state = $3, pincode = $4 WHERE id = $5 RETURNING *`,
      [address, city, state, pincode, req.params.id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'Buyer not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
