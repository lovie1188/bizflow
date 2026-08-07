const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const archiver = require('archiver');
const { verifyToken } = require('../middleware/auth');

// ── Patterns to ALWAYS exclude (credentials & secrets) ─────────
const ALWAYS_EXCLUDE = [
  '.env', '.env.*', '*.env',
  'node_modules/**',
  '.git/**',
  '*.log',
  'uploads/**',
  'backups/**',
  '*.key', '*.pem', '*.cert', '*.crt',
  '*secret*', '*credential*', '*password*',
  'package-lock.json',
  '.DS_Store',
  'Thumbs.db',
  'dist/**', 'build/**',
  '.cache/**',
  'coverage/**',
];

const PROJECT_ROOT = path.resolve(__dirname, '../../../'); // d:/xampp/htdocs/bizflow/

// ── GET /api/developer/export/check ──────────────────────────
// Check if archiver is available
router.get('/export/check', verifyToken, (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  try {
    require('archiver');
    res.json({ success: true, message: 'Export module ready' });
  } catch (e) {
    res.json({ success: false, message: 'archiver package not installed' });
  }
});

// ── POST /api/developer/export ────────────────────────────────
// target: 'frontend' | 'backend' | 'all'
router.post('/export', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });

  const { target = 'all' } = req.body;
  if (!['frontend', 'backend', 'all'].includes(target)) {
    return res.status(400).json({ error: "target must be 'frontend', 'backend', or 'all'" });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename  = `bizflow-export-${target}-${timestamp}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });

  archive.on('error', (err) => {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });

  archive.pipe(res);

  const addDir = (relDir, zipPrefix) => {
    const absDir = path.join(PROJECT_ROOT, relDir);
    if (!fs.existsSync(absDir)) return;

    archive.glob('**/*', {
      cwd: absDir,
      ignore: ALWAYS_EXCLUDE,
      dot: false,
    }, { prefix: zipPrefix });
  };

  if (target === 'frontend' || target === 'all') addDir('frontend', 'frontend');
  if (target === 'backend'  || target === 'all') addDir('backend',  'backend');

  // Add a manifest with export info (no secrets)
  const manifest = JSON.stringify({
    exportedAt: new Date().toISOString(),
    target,
    excludedPatterns: ALWAYS_EXCLUDE,
    note: 'All .env files, secrets, node_modules, and credentials have been excluded from this export.',
  }, null, 2);

  archive.append(manifest, { name: 'EXPORT_MANIFEST.json' });

  await archive.finalize();
});

module.exports = router;
