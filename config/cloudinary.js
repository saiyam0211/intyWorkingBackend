// config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with your credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage for different file types
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    // Different folders for different types of assets
    folder: (req, file) => {
      if (file.fieldname === 'logo') return 'company-logos';
      if (file.fieldname.startsWith('bannerImage')) return 'company-banners';
      if (file.fieldname === 'digitalBrochure') return 'company-brochures';
      if (req.fileCategory === 'designer-portfolios') return 'designer-portfolios';
      if (req.fileCategory === 'craftsman-portfolios') return 'craftsman-portfolios';
      if (file.fieldname === 'testimonialsAttachment') return 'company-testimonials';
      if (file.fieldname === 'testimonialImage') return 'testimonials-images';
      if (file.fieldname.includes('testimonial_') && file.fieldname.includes('_image')) return 'testimonials-images';
      return 'company-misc';
    },
    // Set public_id to be unique
    public_id: (req, file) => {
      const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      return uniqueFileName;
    },
    // Handle resource type automatically
    resource_type: 'auto'
  }
});

// Configure multer with file size limits and filters
const fileFilter = (req, file, cb) => {
  // For images (logo and banner images)
  if (file.fieldname === 'logo' || file.fieldname.startsWith('bannerImage') || 
      file.fieldname === 'testimonialImage' || 
      (file.fieldname.includes('testimonial_') && file.fieldname.includes('_image'))) {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Images Only! Please upload a jpeg, jpg, png, or gif file.'));
    }
  }
  
  // For PDF documents
  else if (file.fieldname === 'digitalBrochure' || file.fieldname === 'testimonialsAttachment') {
    const filetypes = /pdf/;
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: PDF Only! Please upload a PDF file.'));
    }
  } 
  else if (req.fileCategory === 'designer-portfolios' || req.fileCategory === 'craftsman-portfolios') {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Error: Images Only! Please upload a jpeg, jpg, png, or gif file.'));
    }
  }
  // For any other file types
  else {
    cb(null, true);
  }
};

// Create multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: fileFilter
});

// Create an upload fields configuration for the company controller
const uploadFields = [
  { name: 'logo', maxCount: 1 },
  { name: 'bannerImage0', maxCount: 1 },
  { name: 'bannerImage1', maxCount: 1 },
  { name: 'bannerImage2', maxCount: 1 },
  { name: 'bannerImage3', maxCount: 1 },
  { name: 'bannerImage4', maxCount: 1 },
  { name: 'bannerImage5', maxCount: 1 },
  { name: 'bannerImage6', maxCount: 1 },
  { name: 'bannerImage7', maxCount: 1 },
  { name: 'bannerImage8', maxCount: 1 },
  { name: 'bannerImage9', maxCount: 1 },
  { name: 'digitalBrochure', maxCount: 1 },
  { name: 'testimonialsAttachment', maxCount: 1 },
  { name: 'testimonialImage', maxCount: 1 },
  // Add new testimonial image fields
  { name: 'testimonial_0_image', maxCount: 1 },
  { name: 'testimonial_1_image', maxCount: 1 },
  { name: 'testimonial_2_image', maxCount: 1 }
];

// Function to delete a file from Cloudinary
const deleteFile = async (publicUrl) => {
  try {
    if (!publicUrl) return;
    
    // Extract the public ID from the Cloudinary URL
    // Typical URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234/folder/public_id.ext
    const urlParts = publicUrl.split('/');
    const publicIdWithExtension = urlParts[urlParts.length - 1];
    const publicIdParts = publicIdWithExtension.split('.');
    let publicId = publicIdParts[0];
    
    // If the URL includes a folder, add it to the public ID
    const folderIndex = urlParts.indexOf('upload');
    if (folderIndex !== -1 && folderIndex < urlParts.length - 2) {
      const folder = urlParts.slice(folderIndex + 1, -1).join('/');
      publicId = `${folder}/${publicId}`;
    }
    
    // Delete the file from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);
    console.log(`File ${publicId} deletion result:`, result);
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadFields,
  deleteFile
};