const Testimonial = require('../models/Testimonial');
const asyncHandler = require('express-async-handler');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all testimonials (admin)
// @route   GET /api/testimonials
// @access  Private/Admin
const getAllTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({}).sort({ order: 1, createdAt: -1 });
  res.json(testimonials);
});

// @desc    Get active testimonials only (public)
// @route   GET /api/testimonials/active
// @access  Public
const getActiveTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
  res.json(testimonials);
});

// @desc    Get testimonial by ID
// @route   GET /api/testimonials/:id
// @access  Private/Admin
const getTestimonialById = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  
  if (testimonial) {
    res.json(testimonial);
  } else {
    res.status(404);
    throw new Error('Testimonial not found');
  }
});

// @desc    Create new testimonial
// @route   POST /api/testimonials
// @access  Private/Admin
const createTestimonial = asyncHandler(async (req, res) => {
  const { name, position, quote, image, order } = req.body;

  if (!name || !position || !quote || !image) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  const testimonial = await Testimonial.create({
    name,
    position,
    quote,
    image,
    order: order || 0,
    isActive: true
  });

  res.status(201).json(testimonial);
});

// @desc    Update testimonial
// @route   PUT /api/testimonials/:id
// @access  Private/Admin
const updateTestimonial = asyncHandler(async (req, res) => {
  const { name, position, quote, image, order, isActive } = req.body;
  
  const testimonial = await Testimonial.findById(req.params.id);
  
  if (testimonial) {
    // If image is being changed and the old one is from cloudinary, delete it
    if (image && image !== testimonial.image && testimonial.image.includes('cloudinary')) {
      try {
        // Extract public ID from cloudinary URL
        const publicId = testimonial.image.split('/').pop().split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        console.error('Error deleting old image:', error);
        // Continue with update even if image deletion fails
      }
    }
    
    testimonial.name = name || testimonial.name;
    testimonial.position = position || testimonial.position;
    testimonial.quote = quote || testimonial.quote;
    testimonial.image = image || testimonial.image;
    testimonial.order = order !== undefined ? order : testimonial.order;
    testimonial.isActive = isActive !== undefined ? isActive : testimonial.isActive;
    
    const updatedTestimonial = await testimonial.save();
    res.json(updatedTestimonial);
  } else {
    res.status(404);
    throw new Error('Testimonial not found');
  }
});

// @desc    Delete testimonial
// @route   DELETE /api/testimonials/:id
// @access  Private/Admin
const deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  
  if (testimonial) {
    // If image is from cloudinary, delete it
    if (testimonial.image.includes('cloudinary')) {
      try {
        // Extract public ID from cloudinary URL
        const publicId = testimonial.image.split('/').pop().split('.')[0];
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      } catch (error) {
        console.error('Error deleting image:', error);
        // Continue with deletion even if image deletion fails
      }
    }
    
    await testimonial.deleteOne();
    res.json({ message: 'Testimonial removed' });
  } else {
    res.status(404);
    throw new Error('Testimonial not found');
  }
});

// @desc    Update testimonial status (active/inactive)
// @route   PATCH /api/testimonials/:id/status
// @access  Private/Admin
const updateTestimonialStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  
  if (isActive === undefined) {
    res.status(400);
    throw new Error('Status field is required');
  }
  
  const testimonial = await Testimonial.findById(req.params.id);
  
  if (testimonial) {
    testimonial.isActive = isActive;
    
    const updatedTestimonial = await testimonial.save();
    res.json(updatedTestimonial);
  } else {
    res.status(404);
    throw new Error('Testimonial not found');
  }
});

module.exports = {
  getAllTestimonials,
  getActiveTestimonials,
  getTestimonialById,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,
  updateTestimonialStatus
};