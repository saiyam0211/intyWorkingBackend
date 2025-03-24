const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: admin._id, 
        isAdmin: true,
        role: 'admin'
      }, 
      process.env.JWT_SECRET || 'your-fallback-jwt-secret', 
      {
        expiresIn: '24h'
      }
    );

    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify if a token belongs to an admin
exports.verifyToken = async (req, res) => {
  try {
    // Token verification is done by the middleware
    // If execution reaches here, the token is valid
    res.json({ 
      verified: true, 
      hasAdminFlag: req.userRole === 'admin' || req.isAdmin === true 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

