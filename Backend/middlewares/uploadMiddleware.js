const multer = require('multer');
const path = require('path');
const { uploadDir } = require('../config/uploadConfig');

// Disk storage targeting configured upload directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const cleanFieldname = (file.fieldname || 'document').replace(/[^a-zA-Z0-9_-]/g, '');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${cleanFieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter restricting to images (JPG, PNG, WEBP) and PDFs
const documentFileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg',
    'application/pdf',
  ];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    const err = new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF documents are allowed.');
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file limit matching Jasmin-CRM
  },
  fileFilter: documentFileFilter,
});

module.exports = upload;

