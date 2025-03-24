const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, verifyToken } = require('../middleware/authMiddleware');

// Create a payment order - support flexible authentication
router.post('/create-order', paymentController.createOrder);

// Verify payment
router.post('/verify-payment', paymentController.verifyPayment);

// Get user credits
router.get('/credits/:userId', paymentController.getUserCredits);

// Use a credit to view a contact
router.post('/use-credit', paymentController.useCredit);

module.exports = router; 