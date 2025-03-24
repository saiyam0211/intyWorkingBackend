const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

// Get all subscriptions
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type, isActive: true } : { isActive: true };
    
    const subscriptions = await Subscription.find(query).sort({ amount: 1 });
    res.status(200).json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
};

// Get a single subscription by ID
exports.getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    res.status(200).json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Error fetching subscription', error: error.message });
  }
};

// Create a new subscription (admin only)
exports.createSubscription = async (req, res) => {
  try {
    const { name, amount, contactsCount, type } = req.body;
    
    if (!name || !amount || !contactsCount || !type) {
      return res.status(400).json({ message: 'All fields are required: name, amount, contactsCount, type' });
    }
    
    // Validate type
    if (type !== 'designer' && type !== 'craftsman') {
      return res.status(400).json({ message: 'Type must be either "designer" or "craftsman"' });
    }
    
    const newSubscription = new Subscription({
      name,
      amount,
      contactsCount,
      type
    });
    
    const savedSubscription = await newSubscription.save();
    res.status(201).json(savedSubscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Error creating subscription', error: error.message });
  }
};

// Update a subscription (admin only)
exports.updateSubscription = async (req, res) => {
  try {
    const { name, amount, contactsCount, type, isActive } = req.body;
    const updates = {};
    
    if (name) updates.name = name;
    if (amount) updates.amount = amount;
    if (contactsCount) updates.contactsCount = contactsCount;
    if (type) {
      if (type !== 'designer' && type !== 'craftsman') {
        return res.status(400).json({ message: 'Type must be either "designer" or "craftsman"' });
      }
      updates.type = type;
    }
    if (isActive !== undefined) updates.isActive = isActive;
    
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );
    
    if (!updatedSubscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    res.status(200).json(updatedSubscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Error updating subscription', error: error.message });
  }
};

// Delete a subscription (admin only)
exports.deleteSubscription = async (req, res) => {
  try {
    const deletedSubscription = await Subscription.findByIdAndDelete(req.params.id);
    
    if (!deletedSubscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    res.status(200).json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ message: 'Error deleting subscription', error: error.message });
  }
};

// Get subscription statistics (admin only)
exports.getSubscriptionStats = async (req, res) => {
  try {
    // Get basic subscription stats
    const [allSubscriptions, activeSubscriptions] = await Promise.all([
      Subscription.find(),
      Subscription.find({ isActive: true })
    ]);

    // Get subscription counts by type
    const designerSubscriptions = allSubscriptions.filter(sub => sub.type === 'designer').length;
    const craftsmanSubscriptions = allSubscriptions.filter(sub => sub.type === 'craftsman').length;

    // Get payment stats
    const completedPayments = await Payment.find({ status: 'completed' })
      .populate('subscriptionId')
      .sort({ createdAt: -1 });

    // Calculate total revenue
    const totalRevenue = completedPayments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate monthly revenue (payments in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const monthlyRevenue = completedPayments
      .filter(payment => new Date(payment.createdAt) >= thirtyDaysAgo)
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Count unique users who have made purchases
    const uniqueUsers = [...new Set(completedPayments.map(payment => payment.userId))].length;

    // Get the number of purchases in the last 30 days
    const recentPurchases = completedPayments
      .filter(payment => new Date(payment.createdAt) >= thirtyDaysAgo)
      .length;

    // Return statistics
    res.status(200).json({
      totalSubscriptions: allSubscriptions.length,
      activeSubscriptions: activeSubscriptions.length,
      designerSubscriptions,
      craftsmanSubscriptions,
      totalRevenue,
      monthlyRevenue,
      uniqueUsers,
      recentPurchases,
      // Including recent payment data for possible display in admin panel
      recentPayments: completedPayments.slice(0, 5).map(payment => ({
        id: payment._id,
        date: payment.createdAt,
        amount: payment.amount,
        userId: payment.userId,
        subscriptionName: payment.subscriptionId ? payment.subscriptionId.name : 'Unknown'
      }))
    });
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    res.status(500).json({ message: 'Error fetching subscription statistics', error: error.message });
  }
}; 