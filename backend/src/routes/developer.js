const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const fs = require('fs');
const { errorLogPath } = require('../utils/logger');
const { verifyToken } = require('../middleware/auth');

// Mock data for backups
let backups = [
  { file: 'backup_2026_06_16.sql', size: 1024 * 1024 * 15, date: new Date(Date.now() - 86400000).toISOString() },
  { file: 'backup_2026_06_17.sql', size: 1024 * 1024 * 16, date: new Date().toISOString() }
];

router.get('/backups', verifyToken, (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  res.json({ success: true, backups });
});

router.post('/backups/create', verifyToken, (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  backups.push({ file: `backup_${new Date().getTime()}.sql`, size: 1024 * 1024 * 16, date: new Date().toISOString() });
  res.json({ success: true, message: 'Backup created' });
});

router.post('/backups/restore', verifyToken, (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  res.json({ success: true, message: 'Database restored successfully (MOCK)' });
});

router.get('/logs', verifyToken, (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  
  if (!fs.existsSync(errorLogPath)) {
    return res.json({ success: true, logs: 'No logs found.' });
  }

  // Read last 100 lines (simplified by reading whole file and splitting for this size, since logs rotate or are small)
  fs.readFile(errorLogPath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read logs' });
    const lines = data.trim().split('\n');
    const tail = lines.slice(-200).join('\n');
    res.json({ success: true, logs: tail });
  });
});



router.get('/settings', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  try {
    const result = await pool.query('SELECT key, value FROM system_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/settings', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  try {
    const { key, value } = req.body;
    await pool.query(
      'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()',
      [key, String(value)]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
