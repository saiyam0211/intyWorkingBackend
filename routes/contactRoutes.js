// routes/contactRoutes.js - Updated with auth middleware for contacts
const express = require("express");
const router = express.Router();
const { 
  createContact, 
  getAllContacts, 
  submitEnquiry,
  getAllEnquiries,
  getEnquiryById,
  updateEnquiryStatus,
  markEnquiryAsRead,
  deleteEnquiry
} = require("../controllers/ContactController");
const { verifyToken } = require("../middleware/authMiddleware");

// Print debug information
console.log('Contact routes loaded with the following functions:', {
  createContact: typeof createContact === 'function',
  getAllContacts: typeof getAllContacts === 'function',
  submitEnquiry: typeof submitEnquiry === 'function',
  getAllEnquiries: typeof getAllEnquiries === 'function',
  getEnquiryById: typeof getEnquiryById === 'function',
  updateEnquiryStatus: typeof updateEnquiryStatus === 'function',
  markEnquiryAsRead: typeof markEnquiryAsRead === 'function',
  deleteEnquiry: typeof deleteEnquiry === 'function'
});

// Public route - anyone can submit a contact form
router.post("/", createContact);

// Protected route - only admin can view all contacts
router.get("/", verifyToken, getAllContacts);

// New enquiry routes - PUBLIC route
router.post("/enquiry", submitEnquiry);

// Protected enquiry routes (require authentication)
router.get("/enquiries", verifyToken, getAllEnquiries);
router.get("/enquiry/:id", verifyToken, getEnquiryById);
router.patch("/enquiry/:id/status", verifyToken, updateEnquiryStatus);
router.patch("/enquiry/:id/read", verifyToken, markEnquiryAsRead);
router.delete("/enquiry/:id", verifyToken, deleteEnquiry);

module.exports = router;