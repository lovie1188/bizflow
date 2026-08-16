const express = require('express');
const router = express.Router();
const pool = require('../utils/db');
const fs = require('fs');
const { errorLogPath } = require('../utils/logger');
const { verifyToken } = require('../middleware/auth');

const { performBackup, performRestore, getLocalBackups } = require('../services/backupService');

// ── Real DB Backup Endpoints ─────────────────────────────────────

// GET /api/developer/backups - List all actual backup files on disk
router.get('/backups', verifyToken, (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  try {
    const rawBackups = getLocalBackups();
    // Normalize format for frontend: { file: filename, size: size, date: createdAt }
    const backups = rawBackups.map(b => ({
      file: b.filename,
      filename: b.filename,
      size: b.size,
      date: b.createdAt
    }));
    res.json({ success: true, backups, data: backups });
  } catch (err) {
    res.status(500).json({ error: `Failed to retrieve backups: ${err.message}` });
  }
});

// POST /api/developer/backups/create - Trigger real pg_dump backup
router.post('/backups/create', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  try {
    const filePath = await performBackup();
    const filename = require('path').basename(filePath);
    res.json({ 
      success: true, 
      message: `Real backup created successfully: ${filename}`,
      file: filename
    });
  } catch (err) {
    res.status(500).json({ error: `Backup creation failed: ${err.message}` });
  }
});

// POST /api/developer/backups/restore - Trigger real psql restore from file
router.post('/backups/restore', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  const targetFile = req.body.filePath || req.body.file || req.body.filename;
  if (!targetFile) {
    return res.status(400).json({ error: 'filePath or filename is required for restore' });
  }

  try {
    const result = await performRestore(targetFile);
    res.json({ 
      success: true, 
      message: `Database restored successfully from ${result.file}` 
    });
  } catch (err) {
    res.status(500).json({ error: `Database restore failed: ${err.message}` });
  }
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
