const express = require('express');
const router = express.Router();
const { 
  getAllTestimonials, 
  getActiveTestimonials, 
  getTestimonialById, 
  createTestimonial, 
  updateTestimonial, 
  deleteTestimonial,
  updateTestimonialStatus 
} = require('../controllers/testimonialController');
const { isAdmin } = require('../middleware/authMiddleware');

// Public routes
router.get('/active', getActiveTestimonials);

// Admin routes
router.get('/', isAdmin, getAllTestimonials);
router.get('/:id', isAdmin, getTestimonialById);
router.post('/', isAdmin, createTestimonial);
router.put('/:id', isAdmin, updateTestimonial);
router.delete('/:id', isAdmin, deleteTestimonial);
router.patch('/:id/status', isAdmin, updateTestimonialStatus);

module.exports = router;