const mongoose = require('mongoose');

// Create a testimonial schema for embedding in company documents
const companyTestimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  quote: {
    type: String,
    required: true,
    trim: true
  },
  image: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const companySchema = new mongoose.Schema({
  // Original fields
  name: {
    type: String,
    required: true,
    trim: true
  },
  logo: {
    type: String,
    required: true
  },
  reviews: {
    type: Number,
    default: 0
  },
  projects: {
    type: Number,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  branches: {
    type: Number,
    required: true
  },
  deliveryTimeline: {
    type: String,
    required: true
  },

  // New fields from screenshots
  registeredCompanyName: {
    type: String,
    trim: true
  },
  nameDisplay: {
    type: String,
    trim: true,
    required: true,
  },
  description: {
    type: String,
    required: true
  },
  ageOfCompany: {
    type: String
  },
  availableCities: {
    type: [String]
  },
  officialWebsite: {
    type: String
  },
  fullName: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String
  },
  minMaxBudget: {
    type: String
  },
  type: {
    type: [String],
    default: []
  },
  // Banner images
  bannerImages: {
    type: [String],
    default: []
  },
  discountsOfferTimeline: {
    type: String
  },
  numberOfProjectsCompleted: {
    type: String
  },
  digitalBrochure: {
    type: String
  },
  usp: {
    type: String
  },
  testimonialsAttachment: {
    type: String
  },
  contactEmail: {
    type: String
  },
  googleRating: {
    type: String
  },
  googleReviews: {
    type: String
  },
  anyAwardWon: {
    type: String
  },
  categoryType: {
    type: String
  },
  paymentType: {
    type: String
  },
  assured: {
    type: String
  },
  workInTeams: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  latitude: {
    type: String,
    required: true,
  },
  longitude: {
    type: String,
    required: true,
  },
  topRated: {
    type: Boolean,
    required: true,
    default: false
  },
  show: {
    type: Boolean,
    required: true,
    default: true
  },

  // New fields for search functionality
  projectType: {
    type: String,
    enum: ["Studio", "1 BHK", "2 BHK", "3 BHK", "4 BHK", "5 BHK", "Duplex", "Penthouse", "Villa", "Commercial", "Kitchen", "Bedroom", "Bathroom", null],
    default: null
  },
  propertySizeRange: {
    type: String,
    enum: ["400 to 600", "600 - 800", "800 - 1000", "1000 - 1200", "1200 - 1400", "1400 - 1600", "1600 - 1800", "1800 - 2000",
      "2000 - 2400", "2400 - 2800", "2800 - 3200", "3200 - 4000", "4000 - 5000", "5000+"]
  },
  priceRange: {
    type: String,
    enum: ["1Lakh to 3Lakh", "3Lakh to 6Lakh", "6Lakh to 10Lakh", "10Lakh to 15Lakh", "15Lakh to 20Lakh",
      "20Lakh to 25Lakh", "25Lakh to 30Lakh", "30Lakh to 40Lakh", "40Lakh+"]
  },
  serviceCategories: {
    type: [String],
    enum: ["Kitchen Design", "Bedroom Design", "Living Room", "Bathroom", "Full Home", "Office Space", "Commercial Space", "Outdoor Design"]
  },
  searchKeywords: {
    type: [String]
  },
  specificNeighborhoods: {
    type: [String]
  },
  basicPriceRange: {
    type: String,
    required: true
  },
  premiumPriceRange: {
    type: String,
    required: true
  },
  luxuryPriceRange: {
    type: String,
    required: true
  },
  originalBasicPriceRange: {
    type: String
  },
  originalPremiumPriceRange: {
    type: String
  },
  originalLuxuryPriceRange: {
    type: String
  },

  // New field for company testimonials
  testimonials: [companyTestimonialSchema]
}, { timestamps: true });

// Add text index for improved search
companySchema.index({
  name: 'text',
  registeredCompanyName: 'text',
  description: 'text',
  searchKeywords: 'text',
  projectType: 'text',
  specificNeighborhoods: 'text'
});

module.exports = mongoose.model('Company', companySchema);