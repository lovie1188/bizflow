const fs   = require('fs');
const path = require('path');

const logDir       = path.join(__dirname, '../../logs');
const errorLogPath = path.join(logDir, 'error.log');

// Ensure logs directory exists on startup
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// Save originals BEFORE overriding — used inside writeLog to avoid recursion
const originalConsoleError = console.error;
const originalConsoleWarn  = console.warn;

// ── Serialize any argument type correctly ──────────────────────────
const formatArg = (arg) => {
  if (arg === null || arg === undefined) return String(arg);

  // Error objects: always use stack so line numbers appear in log
  if (arg instanceof Error) return arg.stack || arg.message;

  // Plain objects / arrays: JSON stringify
  if (typeof arg === 'object') {
    try   { return JSON.stringify(arg, null, 0); }
    catch { return '[Unserializable Object]'; }
  }

  return String(arg);
};

// ── Write one line to error.log asynchronously ────────────────────
const writeLog = (level, args) => {
  const timestamp = new Date().toISOString();
  const message   = args.map(formatArg).join(' ');
  const logLine   = `[${timestamp}] [${level}] ${message}\n`;

  fs.appendFile(errorLogPath, logLine, (writeErr) => {
    if (writeErr) {
      // Use original — NOT the overridden version — to avoid infinite loop
      originalConsoleError('[Logger] Failed to write to error.log:', writeErr.message);
    }
  });
};

// ── Log rotation: keep last 2000 lines when file exceeds 5 MB ─────
const rotateLogs = () => {
  try {
    if (!fs.existsSync(errorLogPath)) return;
    const stat = fs.statSync(errorLogPath);
    if (stat.size > 5 * 1024 * 1024) {                          // 5 MB threshold
      const lines  = fs.readFileSync(errorLogPath, 'utf8').split('\n').filter(Boolean);
      const kept   = lines.slice(-2000).join('\n') + '\n';
      fs.writeFileSync(errorLogPath, kept);
      originalConsoleWarn(`[Logger] Log rotated — kept last 2000 lines (was ${lines.length} lines)`);
    }
  } catch (rotateErr) {
    originalConsoleError('[Logger] Rotation failed:', rotateErr.message);
  }
};

// Rotate on startup (handles large logs from previous runs)
rotateLogs();

// ── Override console.error / console.warn globally ────────────────
// Must be required BEFORE any route files so all errors are captured.
console.error = (...args) => {
  originalConsoleError(...args);   // still print to terminal
  writeLog('ERROR', args);
};

console.warn = (...args) => {
  originalConsoleWarn(...args);
  writeLog('WARN', args);
};

module.exports = { errorLogPath };
