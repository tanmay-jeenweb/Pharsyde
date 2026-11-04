const path = require('path');
const fs = require('fs');

const rawUploadDir = process.env.UPLOAD_DIR || 'uploads';

// Resolve upload directory path. If relative, resolve from Backend root directory.
const uploadDir = path.isAbsolute(rawUploadDir)
  ? rawUploadDir
  : path.resolve(__dirname, '..', rawUploadDir);

// Ensure the directory exists
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`[UploadConfig] Created uploads directory at: ${uploadDir}`);
  } catch (err) {
    console.error(`[UploadConfig Error] Failed to create uploads directory at ${uploadDir}:`, err);
  }
}

module.exports = {
  uploadDir,
  uploadBaseUrl: process.env.UPLOAD_BASE_URL || 'https://pharsyde.jeenhost.in/uploads',
  serveMethod: process.env.UPLOAD_SERVE_METHOD || 'express',

  // Helper to generate public URL for a file
  getFileUrl: (filename) => {
    if (!filename) return null;
    const baseUrl = process.env.UPLOAD_BASE_URL || 'https://pharsyde.jeenhost.in/uploads';
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
    return `${cleanBaseUrl}/${cleanFilename}`;
  },
};

