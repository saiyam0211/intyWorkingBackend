// middleware/auth.js
const jwt = require('jsonwebtoken');

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

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decoded:', decoded);

        req.adminId = decoded.id;
        console.log('Admin ID set:', req.adminId);

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ message: 'Please authenticate', error: error.message });
    }
};

module.exports = auth;