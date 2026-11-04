const express = require('express');
const multer = require('multer');
const upload = require('../middlewares/uploadMiddleware');
const { getFileUrl } = require('../config/uploadConfig');

const router = express.Router();

/**
 * @route   POST /api/upload/document
 * @desc    Upload government-issued document (ID, passport, etc.)
 * @access  Public (Guest or Customer)
 */
router.post('/document', (req, res) => {
  upload.single('document')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File size exceeds 10MB limit. Please upload a smaller document.',
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: err.message || 'File upload failed. Please try again.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file received. Please select a document to upload.',
      });
    }

    const fileUrl = getFileUrl(req.file.filename);

    return res.status(200).json({
      success: true,
      message: 'Document uploaded successfully.',
      filename: req.file.filename,
      fileUrl,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });
  });
});

module.exports = router;

