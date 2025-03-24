
const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  scope: {
    type: String,
    required: true,
  },
  homeType: {
    type: String,
    required: true,
  },
  carpetArea: {
    type: String,
    required: true,
  },
  rooms: [{
    type: String,
  }],
  package: {
    type: String,
    required: true,
  },
  estimatedCost: {
    type: Number,
    required: true,
  },
  userDetails: {
    name: String,
    email: String,
    phone: String,
    city: String,
  },
}, {
  timestamps: true
});

module.exports = mongoose.model('Quote', quoteSchema);