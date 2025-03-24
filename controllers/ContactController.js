// controllers/ContactController.js - Debug version
const Contact = require("../models/Contact");
const Enquiry = require("../models/Enquiry");
const nodemailer = require('nodemailer');
const { 
  generateCompanyEmailTemplate, 
  generateAdminEmailTemplate, 
  generateUserEmailTemplate 
} = require('../utils/emailTemplate');
require('dotenv').config();

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false // Only for development! Remove in production
  },
  debug: true
});

// Verify connection
transporter.verify(function (error, success) {
  if (error) {
    console.log('SMTP connection error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"Interior Design Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// DEBUG: Log when controller is loaded
console.log('ContactController is loaded and running');

// Create contact (original function from your code)
exports.createContact = async (req, res) => {
  console.log('createContact function called');
  try {
    const { name, email, phone, subject, message } = req.body;
    const newContact = new Contact({ name, email, phone, subject, message });
    await newContact.save();
    res.status(201).json({ success: true, message: "Contact saved successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to save contact." });
  }
};

// Get all contacts (original function from your code)
exports.getAllContacts = async (req, res) => {
  console.log('getAllContacts function called');
  try {
    const contacts = await Contact.find();
    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to retrieve contacts." });
  }
};

// Submit new enquiry
exports.submitEnquiry = async (req, res) => {
  console.log('submitEnquiry function called with data:', req.body);
  try {
    const { name, email, mobile, description, companyId, companyName, companyEmail, userId } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !description || !companyId || !companyName) {
      console.log('Validation failed, missing required fields');
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    console.log('Creating new enquiry object');
    // Create new enquiry
    const newEnquiry = new Enquiry({
      name,
      email,
      mobile,
      description,
      companyId,
      companyName,
      userId
    });

    console.log('Saving enquiry to database');
    // Save enquiry to database
    const savedEnquiry = await newEnquiry.save();
    console.log('Enquiry saved successfully:', savedEnquiry._id);

    // Send email to company
    if (companyEmail) {
      console.log('Sending email to company:', companyEmail);
      const companyEmailHtml = generateCompanyEmailTemplate(savedEnquiry);
      
      await sendEmail(
        companyEmail, 
        `New Enquiry from ${name}`, 
        companyEmailHtml
      );
    }

    // Send email to admin
    console.log('Sending email to admin');
    const adminEmailHtml = generateAdminEmailTemplate(savedEnquiry);
    
    await sendEmail(
      'inty.operations@gmail.com', 
      `New Enquiry for ${companyName}`, 
      adminEmailHtml
    );

    // Send confirmation email to user
    console.log('Sending confirmation email to user:', email);
    const userEmailHtml = generateUserEmailTemplate(savedEnquiry);
    
    await sendEmail(
      email, 
      `Your Enquiry to ${companyName} - Confirmation`, 
      userEmailHtml
    );

    console.log('All emails sent, returning success response');
    res.status(201).json({ 
      success: true,
      message: 'Enquiry submitted successfully', 
      enquiry: savedEnquiry 
    });
  } catch (error) {
    console.error('Error submitting enquiry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to submit enquiry',
      error: error.message
    });
  }
};

// Get all enquiries
exports.getAllEnquiries = async (req, res) => {
  console.log('getAllEnquiries function called');
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    res.status(200).json(enquiries);
  } catch (error) {
    console.error('Error fetching enquiries:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch enquiries',
      error: error.message
    });
  }
};

// Get enquiry by ID
exports.getEnquiryById = async (req, res) => {
  console.log('getEnquiryById function called:', req.params.id);
  try {
    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ 
        success: false,
        message: 'Enquiry not found' 
      });
    }
    res.status(200).json(enquiry);
  } catch (error) {
    console.error('Error fetching enquiry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch enquiry',
      error: error.message
    });
  }
};

// Update enquiry status
exports.updateEnquiryStatus = async (req, res) => {
  console.log('updateEnquiryStatus function called:', req.params.id);
  try {
    const { status } = req.body;
    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!updatedEnquiry) {
      return res.status(404).json({ 
        success: false,
        message: 'Enquiry not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Enquiry status updated successfully',
      enquiry: updatedEnquiry
    });
  } catch (error) {
    console.error('Error updating enquiry status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to update enquiry status',
      error: error.message
    });
  }
};

// Mark enquiry as read
exports.markEnquiryAsRead = async (req, res) => {
  console.log('markEnquiryAsRead function called:', req.params.id);
  try {
    const updatedEnquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    
    if (!updatedEnquiry) {
      return res.status(404).json({ 
        success: false,
        message: 'Enquiry not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Enquiry marked as read successfully',
      enquiry: updatedEnquiry
    });
  } catch (error) {
    console.error('Error marking enquiry as read:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to mark enquiry as read',
      error: error.message
    });
  }
};

// Delete enquiry
exports.deleteEnquiry = async (req, res) => {
  console.log('deleteEnquiry function called:', req.params.id);
  try {
    const deletedEnquiry = await Enquiry.findByIdAndDelete(req.params.id);
    
    if (!deletedEnquiry) {
      return res.status(404).json({ 
        success: false,
        message: 'Enquiry not found' 
      });
    }
    
    res.status(200).json({ 
      success: true,
      message: 'Enquiry deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to delete enquiry',
      error: error.message
    });
  }
};