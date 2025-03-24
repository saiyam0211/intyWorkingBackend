const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');  // Adjust path if needed
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// JWT Secret (Load from environment variable!)
const jwtSecret = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Helper function to generate JWT token
const generateToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email, role: user.role }, jwtSecret, {
        expiresIn: '1h' // Token expires in 1 hour
    });
};

// Register Route
router.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        console.log(`Registration attempt with email: ${email}, role: ${role}`);

        // Input validation
        if (!email || !password || !role) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Invalid email format' });
        }

        // Password strength validation
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Role validation
        const allowedRoles = ['company', 'designer', 'craftsman'];
        if (!allowedRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({
            email,
            password: hashedPassword,
            role
        });

        // Save the user
        await newUser.save();
        console.log(`User registered successfully: ${email}`);

        res.status(201).json({ 
            success: true,
            message: 'User registered successfully'
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Registration failed', 
            error: error.message 
        });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`Login attempt with email: ${email}`);

        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Find the user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = generateToken(user);
        console.log(`Login successful for: ${email}`);

        // Send the token and user info back
        res.status(200).json({ 
            success: true,
            message: 'Login successful', 
            token: token, 
            user: { 
                id: user._id, 
                email: user.email, 
                role: user.role 
            } 
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ 
            success: false,
            message: 'Login failed', 
            error: error.message 
        });
    }
});

router.post('/quote', userController.submitQuote);

// Test route to verify authentication
router.get('/test', (req, res) => {
    res.status(200).json({ message: 'User routes working!' });
});

// Add welcome credits for new users
router.post('/welcome-credits', verifyToken, userController.addWelcomeCredits);

// Admin-only routes
router.get('/credits', isAdmin, userController.getAllUserCredits);
router.patch('/credits', isAdmin, userController.addCreditsToUser);
router.get('/welcome-credits-settings', isAdmin, userController.getWelcomeCreditsSettings);
router.put('/welcome-credits-settings', isAdmin, userController.updateWelcomeCreditsSettings);

module.exports = router;