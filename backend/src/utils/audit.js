const pool = require('./db');

/**
 * Log an action to the audit_logs table
 * @param {Object} req - Express request object (for ip, user-agent, userId)
 * @param {String} action - The action performed (e.g., 'Developer Login', 'Settings Updated')
 * @param {String} entity_type - Type of entity affected (e.g., 'User', 'Settings', 'Backup')
 * @param {Number|String} entity_id - ID of the entity affected (can be null)
 * @param {Object} changes - JSON object of changes/details
 */
const logAudit = async (req, action, entity_type, entity_id, changes = {}) => {
  try {
    // If user is authenticated, we usually have req.userId set by verifyToken middleware
    const userId = req.userId || null;
    const ip = req.ip || req.connection?.remoteAddress || 'Unknown';
    const userAgent = req.headers ? req.headers['user-agent'] : 'Unknown';
    
    await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, changes, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, action, entity_type, entity_id, JSON.stringify(changes), ip, userAgent]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
};

module.exports = { logAudit };
