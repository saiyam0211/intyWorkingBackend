// models/Craftsman.js
const mongoose = require('mongoose');

const CraftsmanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
  },
  rate: {
    type: String,
    required: [true, 'Please provide an hourly rate'],
    trim: true,
  },
  rateNumeric: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    required: [true, 'Please provide a location'],
    trim: true,
  },
  latitude: {
    type: String,
    default: ""
  },
  longitude: {
    type: String,
    default: ""
  },
  category: {
    type: String,
    enum: ['Basic', 'Standard', 'Premium', 'Luxury'],
    default: 'Basic',
  },
  experience: {
    type: String,
    required: [true, 'Please provide years of experience'],
    trim: true,
  },
  projectsCompleted: {
    type: String,
    required: [true, 'Please provide number of completed projects'],
    trim: true,
  },
  specialty: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  phoneNumber: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address',
    ],
  },
  portfolio: {
    type: [String], // Array of Cloudinary image URLs
    default: [],
  },
  googleReviews: {
    type: String,
    required: [true, 'Please provide number of Google reviews'],
    trim: true,
  },
  rating: {
    type: String,
    default: '5',
    enum: ['1', '1.5', '2', '2.5', '3', '3.5', '4', '4.5', '5'],
  },
  // Add order field for custom sorting
  order: {
    type: Number,
    default: 0,
    required: true
  },
  // Add show field for list/unlist functionality
  show: {
    type: Boolean,
    default: true
  },
  // isListed field for admin approval status
  isListed: {
    type: Boolean,
    default: false, // Default to unlisted until admin approval
    description: 'Indicates whether this craftsman has been approved for listing by an admin'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
}, { timestamps: true });

// Pre-save middleware to extract and store numeric rate for filtering
CraftsmanSchema.pre('save', function(next) {
  // Extract numeric value from rate (e.g., "₹ 250/hr" -> 250)
  const rateMatch = this.rate.match(/\d+/);
  if (rateMatch) {
    this.rateNumeric = parseInt(rateMatch[0], 10);
  }
  
  // Update the updatedAt field
  this.updatedAt = Date.now();
  
  // If no order is set, set it to the next available order
  if (this.isNew && this.order === 0) {
    mongoose.models.Craftsman.findOne()
      .sort({ order: -1 })
      .then(lastCraftsman => {
        this.order = lastCraftsman ? lastCraftsman.order + 1 : 0;
        next();
      })
      .catch(err => next(err));
  } else {
    next();
  }
});

module.exports = mongoose.model('Craftsman', CraftsmanSchema);