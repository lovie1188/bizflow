const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const errorLogPath = path.join(logDir, 'error.log');

const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

const formatMessage = (args) => {
  return args.map(arg => {
    if (arg instanceof Error) {
      return arg.stack || arg.message;
    } else if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(arg);
  }).join(' ');
};

const writeLog = (level, args) => {
  const timestamp = new Date().toISOString();
  const message = formatMessage(args);
  const logLine = `[${timestamp}] [${level}] ${message}\n`;
  
  fs.appendFile(errorLogPath, logLine, (err) => {
    if (err) {
      // Fallback if writing fails
      originalConsoleError('Failed to write to error log:', err);
    }
  });
};

console.error = (...args) => {
  originalConsoleError(...args);
  writeLog('ERROR', args);
};

console.warn = (...args) => {
  originalConsoleWarn(...args);
  writeLog('WARN', args);
};

module.exports = {
  errorLogPath
};
