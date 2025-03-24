const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { isAdmin } = require('../middleware/authMiddleware');

// Get all subscriptions (public)
router.get('/', subscriptionController.getAllSubscriptions);

// Get subscription by ID (public)
router.get('/:id', subscriptionController.getSubscriptionById);

// Admin-only routes
router.get('/stats/dashboard', isAdmin, subscriptionController.getSubscriptionStats);
router.post('/', isAdmin, subscriptionController.createSubscription);
router.put('/:id', isAdmin, subscriptionController.updateSubscription);
router.delete('/:id', isAdmin, subscriptionController.deleteSubscription);

module.exports = router; 