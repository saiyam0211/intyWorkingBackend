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

        // Check if user already exists with the same email AND role
        try {
            console.log(`Checking for existing user with email: ${email} and role: ${role}`);
            const existingUser = await User.findOne({ email, role });
            console.log('Existing user query result:', existingUser ? 'Found' : 'Not found');
            
            if (existingUser) {
                return res.status(400).json({ message: `Email is already registered as a ${role}` });
            }

            // Check if user has other roles (for informational purposes)
            const otherRoles = await User.find({ email, role: { $ne: role } }).select('role -_id');
            console.log('User has other roles:', otherRoles.length > 0 ? otherRoles.map(r => r.role) : 'None');
        } catch (findError) {
            console.error('Error checking for existing user:', findError);
            throw new Error(`Database query error: ${findError.message}`);
        }

        // Hash the password
        try {
            console.log('Hashing password...');
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create new user
            console.log('Creating new user document...');
            const newUser = new User({
                email,
                password: hashedPassword,
                role
            });
            
            // Save the user
            console.log('Saving user to database...');
            await newUser.save();
            console.log(`User registered successfully: ${email} as ${role}`);
            
            res.status(201).json({ 
                success: true,
                message: 'User registered successfully'
            });
        } catch (saveError) {
            console.error('Error creating or saving user:', saveError);
            
            // Check for duplicate key error (MongoDB error code 11000)
            if (saveError.name === 'MongoError' || saveError.name === 'MongoServerError') {
                if (saveError.code === 11000) {
                    return res.status(400).json({ 
                        message: `Email is already registered as a ${role}`,
                        code: 'DUPLICATE_EMAIL_ROLE'
                    });
                }
            }
            
            throw new Error(`User creation error: ${saveError.message}`);
        }

    } catch (error) {
        console.error("Registration error details:", error);
        // Include stack trace for better debugging
        console.error("Error stack:", error.stack);
        
        res.status(500).json({ 
            success: false,
            message: 'Registration failed', 
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

// Check if email exists (used for pre-registration checks)
router.get('/check-email', async (req, res) => {
    try {
        const { email, role } = req.query;
        
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
        
        // Check if user already exists with this email and role
        const existingUserWithRole = await User.findOne({ email, role });
        
        // Find all roles associated with this email
        const allRolesForEmail = await User.find({ email }).distinct('role');
        
        // Filter out the current role to get only "other" roles
        const otherRoles = role 
            ? allRolesForEmail.filter(r => r !== role) 
            : allRolesForEmail;
        
        res.status(200).json({
            exists: !!existingUserWithRole,
            otherRoles: otherRoles
        });
    } catch (error) {
        console.error("Error checking email:", error);
        res.status(500).json({ 
            message: 'Error checking email', 
            error: error.message 
        });
    }
});

module.exports = router;