const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const UserCredit = require('../models/UserCredit');
const User = require('../models/User');

let razorpay;

try {
  // Initialize Razorpay with keys from environment variables
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_QlRKi8hhbOXwiK',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret_key',
  });
  console.log('Razorpay initialized successfully');
} catch (error) {
  console.error('Failed to initialize Razorpay:', error.message);
}

// Helper function to validate the user
const validateUser = async (userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }
  
  // For Clerk users, we don't require a MongoDB user record
  // This allows Clerk users to make payments without having a MongoDB record
  return true;
};

// Create a payment order
const createOrder = async (req, res) => {
  try {
    const { subscriptionId, userId } = req.body;

    // Input validation
    if (!subscriptionId || !userId) {
      return res.status(400).json({ message: 'Subscription ID and User ID are required' });
    }

    // Find the subscription
    const subscription = await Subscription.findById(subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Validate user (just basic validation)
    try {
      await validateUser(userId);
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    if (!razorpay) {
      // Mock order creation for testing/development
      console.log('Using mock Razorpay for testing');
      
      // Create a mock order ID
      const mockOrderId = 'mock_order_' + Date.now();
      
      // Create payment record in the database
      await Payment.create({
        userId,
        subscriptionId,
        razorpayOrderId: mockOrderId,
        amount: subscription.amount,
        currency: 'INR',
        status: 'created'
      });
      
      return res.status(200).json({
        orderId: mockOrderId,
        amount: subscription.amount * 100,
        currency: 'INR'
      });
    }

    // Create receipt ID (must be unique and not too long)
    const receiptId = `receipt_${Date.now().toString().slice(-10)}_${userId.slice(-5)}`;
    
    // Create order with Razorpay
    const options = {
      amount: subscription.amount * 100, // Amount in smallest currency unit (paise)
      currency: 'INR',
      receipt: receiptId,
      payment_capture: 1 // Auto-capture payment
    };

    const order = await razorpay.orders.create(options);

    // Create payment record in the database
    await Payment.create({
      userId,
      subscriptionId,
      razorpayOrderId: order.id,
      amount: subscription.amount,
      currency: 'INR',
      status: 'created'
    });

    // Send the order ID to the client
    res.status(200).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating order:', error);
    console.log('Error details:', JSON.stringify(error, null, 2));
    // Return a more specific error message if possible
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error in creating order', 
        details: error.message 
      });
    }
    res.status(500).json({ 
      message: 'Failed to create order', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Verify payment after successful Razorpay payment
const verifyPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, userId } = req.body;
    
    // Input validation
    if (!razorpayOrderId || !razorpayPaymentId || !userId) {
      return res.status(400).json({ message: 'Order ID, Payment ID, and User ID are required' });
    }

    // Find the payment record
    let payment = await Payment.findOne({ razorpayOrderId });
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    // If Razorpay is not initialized or we're testing, skip signature verification
    if (razorpay && razorpaySignature) {
      // Verify signature
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_secret_key')
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
        
      if (generatedSignature !== razorpaySignature) {
        return res.status(400).json({ message: 'Invalid signature' });
      }
    } else {
      console.log('Skipping signature verification for testing');
    }

    // Find the subscription
    const subscription = await Subscription.findById(payment.subscriptionId);
    
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    // Update payment status
    payment.status = 'completed';
    payment.paymentId = razorpayPaymentId;
    await payment.save();

    // Find or create user credits
    let userCredit = await UserCredit.findOne({ userId });
    
    if (!userCredit) {
      userCredit = new UserCredit({
        userId,
        designerCredits: 0,
        craftsmanCredits: 0,
        viewedDesigners: [],
        viewedCraftsmen: []
      });
    }

    // Add credits based on subscription type
    if (subscription.type === 'designer') {
      userCredit.designerCredits += subscription.contactsCount;
    } else if (subscription.type === 'craftsman') {
      userCredit.craftsmanCredits += subscription.contactsCount;
    }

    await userCredit.save();

    // Update user with reference to user credits if not already set
    // This only applies to MongoDB users, not Clerk users
    try {
      const user = await User.findById(userId);
      if (user && !user.credits) {
        user.credits = userCredit._id;
        await user.save();
      }
    } catch (error) {
      // It's okay if this fails for Clerk users who don't have MongoDB records
      console.log('User credits reference update not applicable (likely Clerk user)');
    }

    // Return the updated credits
    res.status(200).json({
      message: 'Payment verified successfully',
      credits: {
        designerCredits: userCredit.designerCredits,
        craftsmanCredits: userCredit.craftsmanCredits,
        viewedDesigners: userCredit.viewedDesigners,
        viewedCraftsmen: userCredit.viewedCraftsmen
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Failed to verify payment', error: error.message });
  }
};

// Get user credits
const getUserCredits = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Find user credits
    let userCredit = await UserCredit.findOne({ userId });
    
    // If user credits don't exist, create a new record
    if (!userCredit) {
      userCredit = await UserCredit.create({
        userId,
        designerCredits: 0,
        craftsmanCredits: 0,
        viewedDesigners: [],
        viewedCraftsmen: []
      });

      // Try to update user with reference to user credits
      // Skip for Clerk users who don't have MongoDB records
      try {
        const user = await User.findById(userId);
        if (user) {
          user.credits = userCredit._id;
          await user.save();
        }
      } catch (error) {
        console.log('User credits reference update not applicable (likely Clerk user)');
      }
    }

    res.status(200).json({
      designerCredits: userCredit.designerCredits,
      craftsmanCredits: userCredit.craftsmanCredits,
      viewedDesigners: userCredit.viewedDesigners,
      viewedCraftsmen: userCredit.viewedCraftsmen
    });
  } catch (error) {
    console.error('Error getting user credits:', error);
    res.status(500).json({ message: 'Failed to get user credits', error: error.message });
  }
};

// Use a credit to view contact details
const useCredit = async (req, res) => {
  try {
    const { userId, contactId, contactType } = req.body;
    
    // Input validation
    if (!userId || !contactId || !contactType) {
      return res.status(400).json({ 
        message: 'User ID, Contact ID, and Contact Type are required' 
      });
    }

    // Find user credits
    let userCredit = await UserCredit.findOne({ userId });
    
    if (!userCredit) {
      return res.status(404).json({ message: 'User credits not found' });
    }

    // Check if contact has already been viewed
    if (contactType === 'designer' && userCredit.viewedDesigners.includes(contactId)) {
      return res.status(200).json({
        message: 'Contact already viewed, no credits deducted',
        designerCredits: userCredit.designerCredits,
        craftsmanCredits: userCredit.craftsmanCredits,
        viewedDesigners: userCredit.viewedDesigners,
        viewedCraftsmen: userCredit.viewedCraftsmen
      });
    }
    
    if (contactType === 'craftsman' && userCredit.viewedCraftsmen.includes(contactId)) {
      return res.status(200).json({
        message: 'Contact already viewed, no credits deducted',
        designerCredits: userCredit.designerCredits,
        craftsmanCredits: userCredit.craftsmanCredits,
        viewedDesigners: userCredit.viewedDesigners,
        viewedCraftsmen: userCredit.viewedCraftsmen
      });
    }

    // Check if user has enough credits
    if (contactType === 'designer') {
      if (userCredit.designerCredits <= 0) {
        return res.status(400).json({ message: 'Not enough designer credits' });
      }
      
      // Deduct credit and add to viewed list
      userCredit.designerCredits -= 1;
      userCredit.viewedDesigners.push(contactId);
    } else if (contactType === 'craftsman') {
      if (userCredit.craftsmanCredits <= 0) {
        return res.status(400).json({ message: 'Not enough craftsman credits' });
      }
      
      // Deduct credit and add to viewed list
      userCredit.craftsmanCredits -= 1;
      userCredit.viewedCraftsmen.push(contactId);
    }

    await userCredit.save();

    // Return updated credits
    res.status(200).json({
      message: 'Credit used successfully',
      designerCredits: userCredit.designerCredits,
      craftsmanCredits: userCredit.craftsmanCredits,
      viewedDesigners: userCredit.viewedDesigners,
      viewedCraftsmen: userCredit.viewedCraftsmen
    });
  } catch (error) {
    console.error('Error using credit:', error);
    res.status(500).json({ message: 'Failed to use credit', error: error.message });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getUserCredits,
  useCredit
}; 