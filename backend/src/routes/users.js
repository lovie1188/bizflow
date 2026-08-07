const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { verifyToken, requireRole } = require('../middleware/auth');


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

// UPDATE STAFF
router.put('/staff/:id', verifyToken, requireRole('admin'), async (req, res) => {
  const { name, email, role, active } = req.body;
  try {
    await pool.query('BEGIN');
    
    // Check if staff belongs to the admin's company
    const checkStaff = await pool.query('SELECT id FROM user_companies WHERE user_id = $1 AND company_id = $2 AND role IN (\'staff\', \'delivery\')', [req.params.id, req.companyId]);
    if (checkStaff.rows.length === 0) {
      throw new Error('Staff member not found or access denied');
    }

    // Update user details
    if (name || email || active !== undefined) {
      await pool.query(
        'UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), active = COALESCE($3, active) WHERE id = $4',
        [name, email, active !== undefined ? active : null, req.params.id]
      );
    }

    // Update role in user_companies
    if (role) {
      await pool.query(
        'UPDATE user_companies SET role = $1 WHERE user_id = $2 AND company_id = $3',
        [role, req.params.id, req.companyId]
      );
      // Also update primary role in users table (for simplicity)
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
    }

    await pool.query('COMMIT');
    res.json({ success: true, message: 'Staff updated successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

// DELETE STAFF
router.delete('/staff/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    await pool.query('BEGIN');
    
    // Check if staff belongs to the admin's company
    const checkStaff = await pool.query('SELECT id FROM user_companies WHERE user_id = $1 AND company_id = $2 AND role IN (\'staff\', \'delivery\')', [req.params.id, req.companyId]);
    if (checkStaff.rows.length === 0) {
      throw new Error('Staff member not found or access denied');
    }

    // Remove from user_companies (soft detach or full delete depends on business logic, here we delete the link)
    await pool.query('DELETE FROM user_companies WHERE user_id = $1 AND company_id = $2', [req.params.id, req.companyId]);
    
    // Note: We don't delete the user completely from `users` table as they might belong to other companies, 
    // or they could be deactivated instead. But for a simple SaaS, deleting the link is fine.
    
    await pool.query('COMMIT');
    res.json({ success: true, message: 'Staff removed successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
