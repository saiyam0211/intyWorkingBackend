const mongoose = require('mongoose');

const siteSettingsSchema = new mongoose.Schema({
  welcomeCredits: {
    designer: {
      type: Number,
      default: 3, // Default 3 designer credits for new users
      min: 0,
      max: 100
    },
    craftsman: {
      type: Number,
      default: 3, // Default 3 craftsman credits for new users
      min: 0,
      max: 100
    }
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
siteSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create a singleton pattern - ensure only one settings document exists
siteSettingsSchema.statics.getSiteSettings = async function() {
  const settings = await this.findOne({});
  if (settings) {
    return settings;
  }
  
  // If no settings exist, create default settings
  return this.create({});
};

const SiteSettings = mongoose.model('SiteSettings', siteSettingsSchema);

module.exports = SiteSettings; 