const express = require('express');
const pool = require('../utils/db');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');


router.get('/', verifyToken, async (req, res, next) => {
  try {
    let query = '';
    let params = [];
    if (req.role === 'developer') {
      query = `SELECT a.id, a.user_id, u.name as user_name, u.email as user_email, 
                      a.action, a.entity_type, a.entity_id, a.changes, 
                      a.ip_address, a.user_agent, a.created_at
               FROM audit_logs a
               LEFT JOIN users u ON a.user_id = u.id
               ORDER BY a.created_at DESC LIMIT 100`;
    } else if (req.role === 'admin') {
      query = `SELECT a.id, a.user_id, u.name as user_name, u.email as user_email, 
                      a.action, a.entity_type, a.entity_id, a.changes, 
                      a.ip_address, a.user_agent, a.created_at
               FROM audit_logs a
               JOIN users u ON a.user_id = u.id
               JOIN user_companies uc ON u.id = uc.user_id
               WHERE uc.company_id = $1
               ORDER BY a.created_at DESC LIMIT 100`;
      params = [req.companyId];
    } else {
      return res.status(403).json({ error: 'Access denied: Admin role required' });
    }

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
