const { google } = require('googleapis');
const path = require('path');
const stream = require('stream');

// Path relative to src/utils
const KEYFILEPATH = path.join(__dirname, '../../google-service-account.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
  keyFile: KEYFILEPATH,
  scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Get or create a subfolder in Google Drive
 * @param {string} folderName 
 * @param {string} parentFolderId 
 * @returns {Promise<string>} folderId
 */
const getOrCreateFolder = async (folderName, parentFolderId) => {
  try {
    // 1. Search if folder already exists
    const query = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentFolderId}' in parents and trashed=false`;
    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive',
    });

    if (response.data.files && response.data.files.length > 0) {
      return response.data.files[0].id; // Return existing folder ID
    }

    // 2. Create the folder if it doesn't exist
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id',
    });

    return folder.data.id;
  } catch (err) {
    console.error('Error in getOrCreateFolder:', err);
    throw err;
  }
};

/**
 * Upload a file to Google Drive
 * @param {Buffer} fileBuffer - The file buffer from multer
 * @param {string} fileName - Original file name
 * @param {string} mimeType - File mime type
 * @param {string} folderId - Target folder ID
 * @returns {Promise<string>} - Returns the webViewLink
 */
const uploadToDrive = async (fileBuffer, fileName, mimeType, folderId = null, isPublic = false) => {
  const fileMetadata = {
    name: fileName,
    parents: folderId ? [folderId] : [],
  };

  const media = {
    mimeType: mimeType,
    body: stream.Readable.from(fileBuffer),
  };

  try {
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink',
    });

    if (isPublic) {
      // Make the file publicly accessible so users can view the image/PDF
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });
    }

    // We return webViewLink (for viewing in browser). webContentLink is for direct download.
    return file.data.webViewLink;
  } catch (err) {
    console.error('Google Drive Upload Error:', err);
    throw err;
  }
};

module.exports = {
  uploadToDrive,
  getOrCreateFolder,
};
