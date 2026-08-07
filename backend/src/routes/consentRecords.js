const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');


// GET: Fetch consent records
router.get('/', verifyToken, async (req, res, next) => {
  try {
    let query, params;
    if (req.role === 'developer') {
      query = `SELECT c.*, u.email as user_email 
               FROM consent_records c 
               LEFT JOIN users u ON c.user_id = u.id 
               ORDER BY c.timestamp DESC LIMIT 100`;
      params = [];
    } else {
      query = `SELECT id, purpose, data_types, consent_given, timestamp, ip_address, version 
               FROM consent_records 
               WHERE user_id = $1 
               ORDER BY timestamp DESC`;
      params = [req.userId];
    }
    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

// POST: Create a new consent record
router.post('/', verifyToken, async (req, res, next) => {
  const { purpose, data_types, consent_given, version } = req.body;
  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
    const result = await pool.query(
      `INSERT INTO consent_records (user_id, purpose, data_types, consent_given, ip_address, version) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [req.userId, purpose, data_types, consent_given, ipAddress, version || '1.0']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
