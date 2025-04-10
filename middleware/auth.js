// middleware/auth.js
const jwt = require('jsonwebtoken');
const { verifyClerkToken } = require('./authMiddleware');

const auth = async (req, res, next) => {
    try {
        console.log('Auth middleware - checking token');
        const authHeader = req.header('Authorization');
        console.log('Auth header:', authHeader);

        if (!authHeader) {
            throw new Error('No Authorization header');
        }

        const token = authHeader.replace('Bearer ', '');
        console.log('Token extracted:', token);

        try {
            // First try to verify as a Clerk token
            const clerkData = await verifyClerkToken(token);
            console.log('Token verified as Clerk token:', clerkData);
            
            // Check if email is in admin list
            const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : [];
            
            if (clerkData.email && adminEmails.includes(clerkData.email)) {
                req.adminId = clerkData.id;
                req.isClerkAuth = true;
                console.log('Admin auth successful via Clerk');
                return next();
            } else {
                console.log('Not an admin email:', clerkData.email);
                throw new Error('Not authorized as admin');
            }
        } catch (clerkError) {
            console.log('Not a Clerk token, trying JWT:', clerkError.message);
            // If not a Clerk token, try with JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded as JWT:', decoded);

            req.adminId = decoded.id;
            console.log('Admin ID set:', req.adminId);
            next();
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Please authenticate', error: error.message });
    }
};

module.exports = auth;