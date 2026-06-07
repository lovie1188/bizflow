const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const { verifyToken, requireRole } = require('../middleware/auth');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// GET STAFF FOR COMPANY
router.get('/staff', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.name, u.email, u.active, u.created_at, uc.role 
       FROM users u 
       JOIN user_companies uc ON u.id = uc.user_id 
       WHERE uc.company_id = $1 AND uc.role IN ('staff', 'delivery')`,
      [req.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE STAFF
router.post('/staff', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, email, password, role } = req.body; // role typically 'staff' or 'delivery'
  const userRole = role || 'staff';

  try {
    await pool.query('BEGIN');
    
    // Check if email already exists
    const checkUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (checkUser.rows.length > 0) {
      throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const userResult = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
      [name, email, hashedPassword, userRole]
    );
    const userId = userResult.rows[0].id;

    // Link user to company
    await pool.query(
      'INSERT INTO user_companies (user_id, company_id, role) VALUES ($1, $2, $3)',
      [userId, req.companyId, userRole]
    );

    await pool.query('COMMIT');
    res.status(201).json(userResult.rows[0]);
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
