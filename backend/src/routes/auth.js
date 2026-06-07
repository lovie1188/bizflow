const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// REGISTER NEW COMPANY
router.post('/register', async (req, res) => {
  const { companyName, gstin, email, password } = req.body;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Start transaction
    await pool.query('BEGIN');

    const companyResult = await pool.query(
      'INSERT INTO companies (name, gstin) VALUES ($1, $2) RETURNING id',
      [companyName, gstin]
    );
    const companyId = companyResult.rows[0].id;

    const userResult = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [companyName, email, hashedPassword, 'admin']
    );
    const userId = userResult.rows[0].id;

    await pool.query(
      'INSERT INTO user_companies (user_id, company_id, role) VALUES ($1, $2, $3)',
      [userId, companyId, 'admin']
    );

    await pool.query('COMMIT');

    const token = jwt.sign(
      { userId, role: 'admin', companyId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      token, 
      company: { id: companyId, name: companyName, gstin },
      message: 'Company registered successfully'
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// REGISTER NEW BUYER
router.post('/register-buyer', async (req, res) => {
  const { businessName, gstin, phone, address, email, password, companyId } = req.body;
  
  // We need a companyId to attach this buyer to a supplier.
  // In a single-supplier setup, we default to 1 if not provided.
  const supplierId = companyId || 1;
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Start transaction
    await pool.query('BEGIN');

    // Create the buyer user account
    const userResult = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [businessName, email, hashedPassword, 'buyer']
    );
    const userId = userResult.rows[0].id;

    // Create the buyer entity linked to the supplier
    const buyerResult = await pool.query(
      'INSERT INTO buyers (company_id, name, gstin, phone, email, address, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [supplierId, businessName, gstin, phone, email, address, 'pending']
    );
    const buyerEntityId = buyerResult.rows[0].id;

    await pool.query('COMMIT');

    const token = jwt.sign(
      { userId, role: 'buyer', companyId: supplierId, buyerEntityId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      token, 
      user: { id: userId, name: businessName, role: 'buyer' },
      buyerEntity: { id: buyerEntityId, status: 'pending' },
      message: 'Buyer registered successfully'
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const userResult = await pool.query(
      'SELECT u.*, uc.company_id, uc.role as company_role FROM users u LEFT JOIN user_companies uc ON u.id = uc.user_id WHERE u.email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userResult.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    let buyerEntityId = null;
    let buyerStatus = null;
    if (user.role === 'buyer') {
      const buyerRes = await pool.query('SELECT id, status FROM buyers WHERE email = $1', [user.email]);
      if (buyerRes.rows.length > 0) {
        buyerEntityId = buyerRes.rows[0].id;
        buyerStatus = buyerRes.rows[0].status;
      }
    }

    // Fetch full company details for admin/supplier users
    let companyData = null;
    if (user.company_id) {
      const companyRes = await pool.query(
        'SELECT id, name, gstin, email, phone, address, city, state, pincode, invoice_prefix, plan, active FROM companies WHERE id = $1',
        [user.company_id]
      );
      if (companyRes.rows.length > 0) {
        companyData = companyRes.rows[0];
      }
    }

    const token = jwt.sign(
      { userId: user.id, role: user.company_role || user.role, companyId: user.company_id, buyerEntityId },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({ 
      success: true, 
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.company_role || user.role },
      company: companyData,
      buyerEntity: buyerEntityId ? { id: buyerEntityId, status: buyerStatus } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
