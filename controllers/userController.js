const Quote = require('../models/Quote.js');
const nodemailer = require('nodemailer');
const { generateEmailTemplate } = require('../utils/emailTemplate.js');
const UserCredit = require('../models/UserCredit');
const SiteSettings = require('../models/SiteSettings');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',  // Use 'gmail' service instead of manual SMTP configuration
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS  // This should be an App Password
  },
  tls: {
    rejectUnauthorized: false // Only for development!  Remove in production
  },
  debug: true
});

// Verify connectionn
transporter.verify(function (error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

exports.submitQuote = async (req, res) => {
  try {
    // Create and save quote
    const quote = new Quote(req.body);
    await quote.save();

    // Send email
    try {
      await transporter.sendMail({
        from: `"Interior Design Calculator" <${process.env.EMAIL_USER}>`,
        to: req.body.userDetails.email,
        subject: 'Your Interior Design Quote',
        html: generateEmailTemplate(req.body)
      });
      console.log('Email sent successfully');
    } catch (emailError) {
      console.error('Email error details:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Quote submitted successfully',
      quote
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit quote',
      error: error.message 
    });
  }
};

// Add welcome credits for new users
const addWelcomeCredits = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    // Check if user already exists with credits
    let userCredit = await UserCredit.findOne({ userId });
    if (userCredit && userCredit.receivedWelcomeCredits) {
      return res.status(200).json({ 
        message: 'User has already received welcome credits',
        credits: {
          designerCredits: userCredit.designerCredits,
          craftsmanCredits: userCredit.craftsmanCredits
        }
      });
    }

    // Get site settings for welcome credits amount
    const siteSettings = await SiteSettings.getSiteSettings();
    const designerWelcomeCredits = siteSettings.welcomeCredits.designer;
    const craftsmanWelcomeCredits = siteSettings.welcomeCredits.craftsman;

    // If user credit record doesn't exist, create one
    if (!userCredit) {
      userCredit = new UserCredit({
        userId,
        designerCredits: designerWelcomeCredits,
        craftsmanCredits: craftsmanWelcomeCredits,
        receivedWelcomeCredits: true,
        viewedDesigners: [],
        viewedCraftsmen: []
      });
    } else {
      // Update existing user credit record
      userCredit.designerCredits += designerWelcomeCredits;
      userCredit.craftsmanCredits += craftsmanWelcomeCredits;
      userCredit.receivedWelcomeCredits = true;
    }

    await userCredit.save();

    res.status(200).json({
      message: 'Welcome credits added successfully',
      credits: {
        designerCredits: userCredit.designerCredits,
        craftsmanCredits: userCredit.craftsmanCredits
      }
    });
  } catch (error) {
    console.error('Error adding welcome credits:', error);
    res.status(500).json({ message: 'Failed to add welcome credits', error: error.message });
  }
};

// Get all users with their credits
const getAllUserCredits = async (req, res) => {
  try {
    const userCredits = await UserCredit.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      users: userCredits
    });
  } catch (error) {
    console.error('Error fetching user credits:', error);
    res.status(500).json({ message: 'Failed to fetch user credits', error: error.message });
  }
};

// Update welcome credits settings
const updateWelcomeCreditsSettings = async (req, res) => {
  try {
    const { designerCredits, craftsmanCredits } = req.body;

    if (designerCredits === undefined && craftsmanCredits === undefined) {
      return res.status(400).json({ message: 'At least one credit type must be provided' });
    }

    // Get site settings
    const siteSettings = await SiteSettings.getSiteSettings();
    
    // Update values if provided
    if (designerCredits !== undefined) {
      siteSettings.welcomeCredits.designer = designerCredits;
    }
    
    if (craftsmanCredits !== undefined) {
      siteSettings.welcomeCredits.craftsman = craftsmanCredits;
    }

    await siteSettings.save();

    res.status(200).json({
      message: 'Welcome credits settings updated successfully',
      welcomeCredits: siteSettings.welcomeCredits
    });
  } catch (error) {
    console.error('Error updating welcome credits settings:', error);
    res.status(500).json({ message: 'Failed to update welcome credits settings', error: error.message });
  }
};

// Get welcome credits settings
const getWelcomeCreditsSettings = async (req, res) => {
  try {
    const siteSettings = await SiteSettings.getSiteSettings();
    
    res.status(200).json({
      welcomeCredits: siteSettings.welcomeCredits
    });
  } catch (error) {
    console.error('Error fetching welcome credits settings:', error);
    res.status(500).json({ message: 'Failed to fetch welcome credits settings', error: error.message });
  }
};

// Add credits to a specific user (for admin use)
const addCreditsToUser = async (req, res) => {
  try {
    const { userId, designerCredits, craftsmanCredits } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    if (designerCredits === undefined && craftsmanCredits === undefined) {
      return res.status(400).json({ message: 'At least one credit type must be provided' });
    }

    // Find user credit record
    let userCredit = await UserCredit.findOne({ userId });
    
    // If user doesn't exist, create new record
    if (!userCredit) {
      userCredit = new UserCredit({
        userId,
        designerCredits: designerCredits || 0,
        craftsmanCredits: craftsmanCredits || 0,
        viewedDesigners: [],
        viewedCraftsmen: []
      });
    } else {
      // Update existing record
      if (designerCredits !== undefined) {
        userCredit.designerCredits += designerCredits;
      }
      
      if (craftsmanCredits !== undefined) {
        userCredit.craftsmanCredits += craftsmanCredits;
      }
    }

    await userCredit.save();

    res.status(200).json({
      message: 'Credits added successfully',
      credits: {
        designerCredits: userCredit.designerCredits,
        craftsmanCredits: userCredit.craftsmanCredits
      }
    });
  } catch (error) {
    console.error('Error adding credits to user:', error);
    res.status(500).json({ message: 'Failed to add credits', error: error.message });
  }
};

module.exports = {
  submitQuote: exports.submitQuote,
  addWelcomeCredits,
  getAllUserCredits,
  updateWelcomeCreditsSettings,
  getWelcomeCreditsSettings,
  addCreditsToUser
};