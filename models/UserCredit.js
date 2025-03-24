const mongoose = require('mongoose');

const userCreditSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  designerCredits: {
    type: Number,
    default: 0
  },
  craftsmanCredits: {
    type: Number,
    default: 0
  },
  viewedDesigners: {
    type: [String],
    default: []
  },
  viewedCraftsmen: {
    type: [String],
    default: []
  },
  receivedWelcomeCredits: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
userCreditSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const UserCredit = mongoose.model('UserCredit', userCreditSchema);

module.exports = UserCredit; 