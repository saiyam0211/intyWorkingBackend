// routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { upload, cloudinary } = require('../config/cloudinary');

// Middleware to set file category based on request body or default to general
const setCategoryMiddleware = (req, res, next) => {
  // Use the fileCategory from the request body if provided
  if (req.body && req.body.fileCategory) {
    req.fileCategory = req.body.fileCategory;
  } else {
    // Default category
    req.fileCategory = 'general-uploads';
  }
  next();
};

// @route   POST api/upload
// @desc    Upload single image to Cloudinary
// @access  Private (would normally have auth middleware)
router.post('/', setCategoryMiddleware, upload.single('file'), async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('File uploaded:', req.file);
    console.log('File category:', req.fileCategory);

    // Return the Cloudinary details
    return res.status(200).json({
      secure_url: req.file.path,
      public_id: req.filename,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});

// Handle portfolio image uploads
const portfolioUpload = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'files', maxCount: 10 }
]);

// @route   POST api/upload/portfolio
// @desc    Upload portfolio images to Cloudinary (for designers/craftsmen)
// @access  Private
router.post('/portfolio', portfolioUpload, (req, res, next) => {
  // Set portfolio category
  req.fileCategory = 'portfolio-images';
  next();
}, async (req, res) => {
  try {
    if (!req.files || (!req.files.file && !req.files.files)) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Process single file upload
    if (req.files.file) {
      const file = req.files.file[0];
      
      return res.status(200).json({
        secure_url: file.path,
        public_id: file.filename
      });
    }

    // Process multiple file uploads
    if (req.files.files) {
      const files = req.files.files;
      
      // Return array of Cloudinary results
      const uploads = files.map(file => ({
        secure_url: file.path,
        public_id: file.filename
      }));

      return res.status(200).json(uploads);
    }

    return res.status(400).json({ message: 'File upload issue' });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Error uploading files', error: error.message });
  }
});

// @route    POST api/upload/multiple
// @desc    Upload multiple images to Cloudinary
// @access  Private
router.post('/multiple', setCategoryMiddleware, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Process multiple file uploads
    const uploads = req.files.map(file => ({
      secure_url: file.path,
      public_id: file.filename
    }));

    return res.status(200).json(uploads);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ message: 'Error uploading files', error: error.message });
  }
});

module.exports = router;