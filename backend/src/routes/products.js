const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { verifyToken, requireRole } = require('../middleware/auth');
const { validateRequest, productSchema } = require('../middleware/validate');
const { uploadToDrive, getOrCreateFolder } = require('../utils/googleDriveService');


// Configure Multer for in-memory uploads before sending to Google Drive
const storage = multer.memoryStorage();

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

  const { sku, name, hsnCode, gstRate, unit, buyPrice, tradePrice, minOrderQty, brand } = req.body;
  
  let imageUrl = null;
  if (req.file) {
    try {
      const companyRes = await pool.query('SELECT name FROM companies WHERE id = $1', [req.companyId]);
      const companyName = companyRes.rows[0]?.name || `Company_${req.companyId}`;
      const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      const companyFolderId = await getOrCreateFolder(companyName, rootFolderId);
      const productsFolderId = await getOrCreateFolder('Products', companyFolderId);
      const imagesFolderId = await getOrCreateFolder('images', productsFolderId);

      const fileName = `product-${Date.now()}-${req.file.originalname}`;
      imageUrl = await uploadToDrive(req.file.buffer, fileName, req.file.mimetype, imagesFolderId, false); // product images private — served via Drive viewer link
    } catch (uploadError) {
      return res.status(500).json({ error: 'Failed to upload image to Google Drive' });
    }
  }
  
  try {
    const result = await pool.query(
      'INSERT INTO products (company_id, sku, name, hsn_code, gst_rate, unit, buy_price, trade_price, min_order_qty, image_url, brand) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [req.companyId, sku, name, hsnCode, gstRate, unit, buyPrice, tradePrice, minOrderQty, imageUrl, brand || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET PRODUCTS (Paginated)
// Public access allowed for buyer storefront, but sensitive fields stripped for unauthenticated callers.
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    // L-6: Cap limit to prevent full-table dumps
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const companyId = req.query.companyId;

    // Determine if caller is an authenticated admin (to allow buy_price)
    let isAuthenticatedAdmin = false;
    try {
      const jwt = require('jsonwebtoken');
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
        isAuthenticatedAdmin = decoded?.role === 'admin';
      }
    } catch (_) { /* unauthenticated — fine for public catalog */ }

    // H-7: Strip internal cost field (buy_price) from public responses
    const publicFields = `id, company_id, sku, name, hsn_code, gst_rate, unit, trade_price,
      min_order_qty, image_url, brand, category, description, stock, created_at, updated_at`;
    const adminFields = `*`;
    const selectFields = isAuthenticatedAdmin ? adminFields : publicFields;

    let query = `SELECT ${selectFields} FROM products`;
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

    let brandsQuery = 'SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL';
    let categoriesQuery = 'SELECT DISTINCT category FROM products WHERE category IS NOT NULL';
    let brandsParams = [];
    if (companyId) {
      brandsQuery += ' AND company_id = $1';
      categoriesQuery += ' AND company_id = $1';
      brandsParams.push(companyId);
    }
    const brandsResult = await pool.query(brandsQuery, brandsParams);
    const allBrands = brandsResult.rows.map(r => r.brand).sort();

    const categoriesResult = await pool.query(categoriesQuery, brandsParams);
    const allCategories = categoriesResult.rows.map(r => r.category).sort();

    res.json({
      data: dataResult.rows,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
        allBrands,
        allCategories
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
  const { name, sku, hsn_code, gst_rate, unit, buy_price, trade_price, min_order_qty, stock, category, brand } = body;
  
  let imageUrl = undefined;
  if (req.file) {
    try {
      const companyRes = await pool.query('SELECT name FROM companies WHERE id = $1', [req.companyId]);
      const companyName = companyRes.rows[0]?.name || `Company_${req.companyId}`;
      const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      const companyFolderId = await getOrCreateFolder(companyName, rootFolderId);
      const productsFolderId = await getOrCreateFolder('Products', companyFolderId);
      const imagesFolderId = await getOrCreateFolder('images', productsFolderId);

      const fileName = `product-${Date.now()}-${req.file.originalname}`;
      imageUrl = await uploadToDrive(req.file.buffer, fileName, req.file.mimetype, imagesFolderId, false); // product images private — served via Drive viewer link
    } catch (uploadError) {
      return res.status(500).json({ error: 'Failed to upload image to Google Drive' });
    }
  }

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
        brand = COALESCE($11, brand),
        image_url = COALESCE($12, image_url)
      WHERE id = $13 AND company_id = $14 RETURNING *`,
      [name, sku, hsn_code, gst_rate, unit, buy_price, trade_price, min_order_qty, stock, category, brand || undefined, imageUrl, req.params.id, req.companyId]
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
