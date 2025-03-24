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
const auth = require('../middleware/auth');

// Public routes
router.get('/active', getActiveTestimonials);

// Admin routes
router.get('/', auth, getAllTestimonials);
router.get('/:id', auth, getTestimonialById);
router.post('/', auth, createTestimonial);
router.put('/:id', auth, updateTestimonial);
router.delete('/:id', auth, deleteTestimonial);
router.patch('/:id/status', auth, updateTestimonialStatus);

module.exports = router;