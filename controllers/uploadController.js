const { upload } = require('../config/cloudinary');
const asyncHandler = require('express-async-handler');

// Single file upload controller
const uploadSingleFile = asyncHandler(async (req, res) => {
  // Define the category in the request for cloudinary folder routing
  if (req.query.category) {
    req.fileCategory = req.query.category;
  }

  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    res.status(200).json({
      message: 'File uploaded successfully',
      fileUrl: req.file.path,
      filename: req.file.filename
    });
  });
});

// Testimonial image upload controller
const uploadTestimonialImage = asyncHandler(async (req, res) => {
  upload.single('testimonialImage')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }
    
    res.status(200).json({
      message: 'Testimonial image uploaded successfully',
      fileUrl: req.file.path,
      filename: req.file.filename
    });
  });
});

module.exports = {
  uploadSingleFile,
  uploadTestimonialImage
};