// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { isAdmin } = require('../middleware/authMiddleware');

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: admin._id, 
        isAdmin: true,
        role: 'admin'
      },
      process.env.JWT_SECRET || 'your-fallback-jwt-secret',
      { expiresIn: '24h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify admin token
router.get('/verify-token', isAdmin, (req, res) => {
  res.json({ 
    valid: true,
    message: 'Token is valid',
    userId: req.userId,
    isAdmin: true,
    hasAdminFlag: true
  });
});

module.exports = router;