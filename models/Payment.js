const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  razorpayPaymentId: {
    type: String,
    default: ''
  },
  razorpayOrderId: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'failed', 'completed'],
    default: 'created'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Payment', paymentSchema); 