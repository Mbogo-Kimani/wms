const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { protect } = require('../middlewares/auth');

// Single file upload (e.g., profile photo)
router.post('/single', protect, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.sendError('No file uploaded', 400);
  }
  
  res.sendSuccess({
    url: req.file.path,
    publicId: req.file.filename,
    originalName: req.file.originalname
  }, 'File uploaded successfully');
});

// Multiple file upload (for future documents)
router.post('/multiple', protect, upload.array('files', 5), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.sendError('No files uploaded', 400);
  }
  
  const files = req.files.map(file => ({
    url: file.path,
    publicId: file.filename,
    originalName: file.originalname
  }));
  
  res.sendSuccess(files, 'Files uploaded successfully');
});

module.exports = router;
