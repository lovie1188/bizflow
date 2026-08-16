/**
 * BizFlow — Developer Export Module
 * Routes:
 *   GET  /api/developer/export/check        — verify archiver is ready
 *   GET  /api/developer/export/tree         — return project file tree (locked files flagged)
 *   POST /api/developer/export              — zip and download (target preset OR selectedFiles list)
 */

const express  = require('express');
const router   = express.Router();
const path     = require('path');
const fs       = require('fs');
const archiver = require('archiver');
const { verifyToken } = require('../middleware/auth');

// ── Files/patterns ALWAYS excluded — enforced server-side too ──────
// Even if frontend sends them in selectedFiles, they will be stripped.
const ALWAYS_EXCLUDE_PATTERNS = [
  '.env',
  '.env.local',
  '.env.production',
  '.env.development',
  'google-service-account.json',   // ← explicitly named (pattern match unreliable)
  'firebase-adminsdk.json',        // common credential file names
  'serviceAccountKey.json',
  'package-lock.json',
  'yarn.lock',
  '.DS_Store',
  'Thumbs.db',
];

// Glob patterns for archiver ignore list
const ALWAYS_EXCLUDE_GLOBS = [
  '**/.env',
  '**/.env.*',
  '**/*.env',
  '**/node_modules/**',
  '**/.git/**',
  '**/*.log',
  '**/uploads/**',
  '**/backups/**',
  '**/*.key',
  '**/*.pem',
  '**/*.cert',
  '**/*.crt',
  '**/*secret*',
  '**/*credential*',
  '**/*password*',
  '**/google-service-account.json',
  '**/serviceAccountKey.json',
  '**/dist/**',
  '**/build/**',
  '**/.cache/**',
  '**/coverage/**',
];

const PROJECT_ROOT = path.resolve(__dirname, '../../../');

// ── Helper: is a given absolute path a locked/secret file? ─────────
const isLockedPath = (absPath) => {
  const basename = path.basename(absPath);
  return ALWAYS_EXCLUDE_PATTERNS.some(p => basename === p || absPath.includes(p.replace('*', '')));
};

// ── Helper: walk a directory recursively, return tree nodes ────────
const walkDir = (dir, baseDir) => {
  const nodes = [];
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch { return nodes; }

  for (const entry of entries) {
    const absPath  = path.join(dir, entry.name);
    const relPath  = path.relative(baseDir, absPath).replace(/\\/g, '/');
    const locked   = isLockedPath(absPath);

    // Skip node_modules, .git, build, logs entirely (don't even show in tree)
    const skip = ['node_modules', '.git', 'build', 'dist', 'coverage', '.cache'].includes(entry.name)
               || entry.name.endsWith('.log');
    if (skip) continue;

    if (entry.isDirectory()) {
      const children = walkDir(absPath, baseDir);
      nodes.push({ type: 'dir', name: entry.name, path: relPath, locked, children });
    } else {
      nodes.push({ type: 'file', name: entry.name, path: relPath, locked });
    }
  }
  return nodes;
};

// ── GET /api/developer/export/check ───────────────────────────────
router.get('/export/check', verifyToken, (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });
  try {
    require('archiver');
    res.json({ success: true, message: 'Export module ready' });
  } catch {
    res.json({ success: false, message: 'archiver package not installed. Run: npm install archiver' });
  }
});

// ── GET /api/developer/export/tree ────────────────────────────────
// Returns project file tree. Locked files flagged — frontend shows them
// greyed out with a lock icon and cannot select them.
router.get('/export/tree', verifyToken, (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });

  try {
    const tree = {
      frontend: walkDir(path.join(PROJECT_ROOT, 'frontend'), PROJECT_ROOT),
      backend:  walkDir(path.join(PROJECT_ROOT, 'backend'),  PROJECT_ROOT),
    };
    res.json({ success: true, tree, projectRoot: PROJECT_ROOT });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/developer/export ────────────────────────────────────
// Body options:
//   { target: 'frontend' | 'backend' | 'all' }     — preset export
//   { selectedFiles: ['backend/src/server.js', ...] } — selective export
router.post('/export', verifyToken, async (req, res) => {
  if (req.role !== 'developer') return res.status(403).json({ error: 'Access denied' });

  const { target, selectedFiles } = req.body;

  // Validate input
  if (!selectedFiles && !['frontend', 'backend', 'all'].includes(target)) {
    return res.status(400).json({ error: "Provide target ('frontend'|'backend'|'all') or selectedFiles array" });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const label     = selectedFiles ? 'custom' : target;
  const filename  = `bizflow-export-${label}-${timestamp}.zip`;

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  const archive = archiver('zip', { zlib: { level: 6 } });

  archive.on('error', (err) => {
    console.error('[Export] Archive error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  });

  archive.pipe(res);

  if (selectedFiles && Array.isArray(selectedFiles) && selectedFiles.length > 0) {
    // ── Selective export — add only requested files ──────────────
    let skipped = 0;
    for (const relPath of selectedFiles) {
      // Server-side lock enforcement — even if frontend sends a locked file, skip it
      if (isLockedPath(relPath)) { skipped++; continue; }

      // Also block any pattern matches
      const isGlobLocked = ALWAYS_EXCLUDE_GLOBS.some(g => {
        const pattern = g.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\//g, path.sep);
        return relPath.includes(pattern.replace(/\\/g, '/').replace(/^\/|\/$/g, ''));
      });
      if (isGlobLocked) { skipped++; continue; }

      const absPath = path.join(PROJECT_ROOT, relPath);
      if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
        archive.file(absPath, { name: relPath });
      }
    }
    if (skipped > 0) console.warn(`[Export] Skipped ${skipped} locked file(s) from selectedFiles`);

  } else {
    // ── Preset export — add entire frontend/backend dirs ─────────
    const addDir = (relDir, zipPrefix) => {
      const absDir = path.join(PROJECT_ROOT, relDir);
      if (!fs.existsSync(absDir)) return;
      archive.glob('**/*', {
        cwd: absDir,
        ignore: ALWAYS_EXCLUDE_GLOBS,
        dot: false,
      }, { prefix: zipPrefix });
    };

    if (target === 'frontend' || target === 'all') addDir('frontend', 'frontend');
    if (target === 'backend'  || target === 'all') addDir('backend',  'backend');
  }

  // Always include manifest (no secrets)
  const manifest = JSON.stringify({
    exportedAt:       new Date().toISOString(),
    exportType:       selectedFiles ? 'selective' : target,
    filesSelected:    selectedFiles ? selectedFiles.length : 'all',
    excludedPatterns: [...ALWAYS_EXCLUDE_PATTERNS, ...ALWAYS_EXCLUDE_GLOBS],
    note: 'Secrets (.env, google-service-account.json, node_modules) are always excluded regardless of selection.',
  }, null, 2);

  archive.append(manifest, { name: 'EXPORT_MANIFEST.json' });
  await archive.finalize();
});

module.exports = router;
