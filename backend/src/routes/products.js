const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest, productSchema } = require('../middleware/validate');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'), false);
    }
  }
});

// CREATE PRODUCT (With Image Upload)
router.post('/', verifyToken, requireRole('admin'), upload.single('image'), async (req, res) => {
  // Can't use validateRequest middleware directly with multer since body is parsed later,
  // so we validate manually here.
  const { error } = productSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });
  }

  const { sku, name, hsnCode, gstRate, unit, buyPrice, tradePrice, minOrderQty } = req.body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
  
  try {
    const result = await pool.query(
      'INSERT INTO products (company_id, sku, name, hsn_code, gst_rate, unit, buy_price, trade_price, min_order_qty, image_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [req.companyId, sku, name, hsnCode, gstRate, unit, buyPrice, tradePrice, minOrderQty, imageUrl]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET PRODUCTS (Paginated)
router.get('/', async (req, res) => {
  // Allow public access for buyer storefront, but filter by companyId if provided
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // In single-supplier mode, we might just fetch all active products
    // For multi-company, we need company_id from query or header
    const companyId = req.query.companyId; 
    
    let query = 'SELECT * FROM products';
    let countQuery = 'SELECT COUNT(*) FROM products';
    let params = [limit, offset];
    let countParams = [];
    
    if (companyId) {
      query += ' WHERE company_id = $3';
      countQuery += ' WHERE company_id = $1';
      params.push(companyId);
      countParams.push(companyId);
    }
    
    query += ' ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    
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

// GET SINGLE PRODUCT
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE PRODUCT
router.put('/:id', verifyToken, requireRole('admin'), upload.single('image'), async (req, res) => {
  const body = req.body || {};
  const { name, sku, hsn_code, gst_rate, unit, buy_price, trade_price, min_order_qty, stock, category } = body;
  const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

  try {
    const result = await pool.query(
      `UPDATE products SET
        name = COALESCE($1, name),
        sku = COALESCE($2, sku),
        hsn_code = COALESCE($3, hsn_code),
        gst_rate = COALESCE($4, gst_rate),
        unit = COALESCE($5, unit),
        buy_price = COALESCE($6, buy_price),
        trade_price = COALESCE($7, trade_price),
        min_order_qty = COALESCE($8, min_order_qty),
        stock = COALESCE($9, stock),
        category = COALESCE($10, category),
        image_url = COALESCE($11, image_url)
      WHERE id = $12 AND company_id = $13 RETURNING *`,
      [name, sku, hsn_code, gst_rate, unit, buy_price, trade_price, min_order_qty, stock, category, imageUrl, req.params.id, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE PRODUCT
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1 AND company_id = $2 RETURNING id',
      [req.params.id, req.companyId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
