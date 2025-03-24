// models/Designer.js
const mongoose = require('mongoose');

const designerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  rate: {
    type: String,
    required: true
  },
  rateNumeric: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: true
  },
  experience: {
    type: String,
    required: true
  },
  projectsCompleted: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  email: {
    type: String,
    trim: true
  },
  portfolio: {
    type: [String],
    required: true,
    validate: {
      validator: function(v) {
        return v.length >= 5;
      },
      message: 'At least 5 portfolio images are required'
    }
  },
  googleReviews: {
    type: String,
    default: '0'
  },
  rating: {
    type: String,
    default: '5'
  },
  // Add show field for list/unlist functionality
  show: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  order: {
    type: Number,
    default: 0,
    required: true
  }
}, { timestamps: true });

// Add text index for search functionality
designerSchema.index({ name: 'text', location: 'text', description: 'text' });

module.exports = mongoose.model('Designer', designerSchema);