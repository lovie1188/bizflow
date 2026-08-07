const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');

// Note: Requires a 'google-service-account.json' file in the backend root directory
const KEYFILEPATH = path.join(__dirname, '../../google-service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

// Use environment variables for DB parsing
const DB_URL = process.env.DATABASE_URL;
// Parse postgres://user:pass@host:port/dbname
const dbUrl = new URL(process.env.DATABASE_URL);
let dbUser = dbUrl.username;
let dbPass = dbUrl.password;
let dbHost = dbUrl.hostname;
let dbPort = dbUrl.port || 5432;
let dbName = dbUrl.pathname.split('/')[1];

if (!dbUser || !dbName) {
  throw new Error('Could not parse database credentials from DATABASE_URL');
}

const BACKUP_DIR = path.join(__dirname, '../../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Ensure you have a GOOGLE_DRIVE_FOLDER_ID in .env
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID || '';

async function uploadToDrive(filePath, fileName) {
  if (!fs.existsSync(KEYFILEPATH)) {
    console.warn('Google Drive Service Account JSON not found. Skipping Drive upload.');
    return;
  }
  if (!FOLDER_ID) {
    console.warn('GOOGLE_DRIVE_FOLDER_ID not set in .env. Skipping Drive upload.');
    return;
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEYFILEPATH,
    scopes: SCOPES,
  });

  const drive = google.drive({ version: 'v3', auth });

  try {
    const fileMetadata = {
      name: fileName,
      parents: [FOLDER_ID]
    };
    const media = {
      mimeType: 'application/octet-stream',
      body: fs.createReadStream(filePath)
    };

    const res = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });
    console.log('File uploaded to Google Drive with ID:', res.data.id);
  } catch (error) {
    console.error('Error uploading to Google Drive:', error.message);
  }
}

async function performBackup() {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${dbName}-${dateStr}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  console.log(`Starting backup: ${fileName}`);

  // Need PGPASSWORD to avoid password prompt
  const env = { ...process.env, PGPASSWORD: dbPass };
  const args = ['-h', dbHost, '-p', String(dbPort), '-U', dbUser, '-F', 'p', '-c', '-f', filePath, dbName];

  return new Promise((resolve, reject) => {
    execFile('pg_dump', args, { env }, async (error, stdout, stderr) => {
      if (error) {
        console.error('Backup failed:', error.message);
        return reject(error);
      }
      console.log('Backup generated locally at', filePath);
      
      // Upload to Drive
      await uploadToDrive(filePath, fileName);

      // Clean up local files older than 15 days
      cleanupLocalBackups(15);
      
      resolve(filePath);
    });
  });
}

function cleanupLocalBackups(retentionDays) {
  const files = fs.readdirSync(BACKUP_DIR);
  const now = Date.now();
  const msInDay = 24 * 60 * 60 * 1000;

  files.forEach(file => {
    if (file.startsWith('backup-')) {
      const p = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(p);
      const diffDays = (now - stat.mtime.getTime()) / msInDay;
      if (diffDays > retentionDays) {
        fs.unlinkSync(p);
        console.log(`Deleted old backup: ${file}`);
      }
    }
  });
}

async function performRestore(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error('Backup file not found locally.');
  }
  
  const env = { ...process.env, PGPASSWORD: dbPass };
  const args = ['-h', dbHost, '-p', String(dbPort), '-U', dbUser, '-d', dbName, '-f', filePath];

  return new Promise((resolve, reject) => {
    execFile('psql', args, { env }, (error, stdout, stderr) => {
      if (error) {
        console.error('Restore failed:', error.message);
        return reject(error);
      }
      console.log('Restore completed.');
      resolve();
    });
  });
}

function getLocalBackups() {
  if (!fs.existsSync(BACKUP_DIR)) return [];
  const files = fs.readdirSync(BACKUP_DIR).filter(f => f.startsWith('backup-'));
  return files.map(file => {
    const p = path.join(BACKUP_DIR, file);
    const stat = fs.statSync(p);
    return {
      filename: file,
      size: stat.size,
      createdAt: stat.mtime
    };
  }).sort((a, b) => b.createdAt - a.createdAt); // newest first
}

module.exports = {
  performBackup,
  performRestore,
  getLocalBackups,
  BACKUP_DIR
};
