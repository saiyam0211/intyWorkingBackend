// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const { Clerk } = require('@clerk/clerk-sdk-node');
require('dotenv').config();

console.log('Clerk Secret Key length:', process.env.CLERK_SECRET_KEY?.length);
console.log('Admin Emails:', process.env.ADMIN_EMAILS);

const clerk = new Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

// Verify Clerk token using Clerk's SDK
const verifyClerkToken = async (token) => {
    try {
        console.log('Starting Clerk token verification...');
        
        // Verify and decode the token using Clerk SDK
        const decodedToken = await clerk.verifyToken(token);
        console.log('Successfully decoded Clerk token:', {
            sub: decodedToken.sub,
            exp: decodedToken.exp,
            iat: decodedToken.iat
        });
        
        // Get the user's data from Clerk
        console.log('Fetching user data for:', decodedToken.sub);
        const user = await clerk.users.getUser(decodedToken.sub);
        console.log('Successfully fetched user data:', {
            id: user.id,
            primaryEmailAddressId: user.primaryEmailAddressId,
            emailAddressesCount: user.emailAddresses?.length
        });
        
        // Get the primary email
        const primaryEmailId = user.primaryEmailAddressId;
        const primaryEmail = user.emailAddresses?.find(email => email.id === primaryEmailId)?.emailAddress;
        
        console.log('Found primary email:', primaryEmail);
        
        if (!primaryEmail) {
            console.error('No primary email found in user data:', user);
            throw new Error('No primary email found');
        }
        
        return {
            id: user.id,
            email: primaryEmail,
            isClerkToken: true
        };
    } catch (error) {
        console.error('Error in verifyClerkToken:', error);
        console.error('Error details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });
        throw error;
    }
};

// Admin authorization middleware
const isAdmin = async (req, res, next) => {
  try {
    console.log('Starting admin authorization check...');
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('No authorization header or invalid format');
      return res.status(401).json({ message: 'Authorization token is required' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token.substring(0, 20) + '...');
    
    try {
      // Try to verify as a Clerk token first
      console.log('Attempting to verify Clerk token...');
      const clerkData = await verifyClerkToken(token);
      console.log('Clerk verification successful:', clerkData);
      
      // Check if email is in admin list
      const adminEmails = process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim()) : [];
      console.log('Configured admin emails:', adminEmails);
      console.log('User email to check:', clerkData.email);
      
      if (clerkData.email && adminEmails.includes(clerkData.email)) {
        console.log('Admin access granted for:', clerkData.email);
        req.userId = clerkData.id;
        req.userEmail = clerkData.email;
        req.userRole = 'admin';
        req.isAdmin = true;
        req.isClerkAuth = true;
        return next();
      }
      
      console.log('Admin access denied. Email not in admin list:', clerkData.email);
      return res.status(403).json({ 
        message: 'Access denied: Admin privileges required',
        details: 'Email not in admin list'
      });
    } catch (clerkError) {
      console.error('Clerk verification failed:', clerkError);
      return res.status(403).json({ 
        message: 'Access denied: Admin privileges required',
        details: clerkError.message
      });
    }
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ 
      message: 'Invalid or expired token',
      details: error.message
    });
  }
};

// Verify JWT token middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token is required' });
  }
  
  const token = authHeader.split(' ')[1];
  console.log('Verifying token:', token.substring(0, 20) + '...');
  
  try {
    // Try as Clerk token first
    try {
      const clerkData = await verifyClerkToken(token);
      req.userId = clerkData.id;
      req.userEmail = clerkData.email;
      req.isClerkAuth = true;
      console.log('Verified as Clerk token:', clerkData);
      return next();
    } catch (clerkError) {
      console.log('Not a valid Clerk token, trying JWT');
      // Not a valid Clerk token, try JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-fallback-jwt-secret');
      req.userId = decoded.userId || decoded.id;
      req.userRole = decoded.role;
      req.isAdmin = decoded.isAdmin;
      console.log('Verified as JWT token:', decoded);
      return next();
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ 
      message: 'Invalid or expired token',
      details: error.message
    });
  }
};

// User authentication middleware
const authenticate = async (req, res, next) => {
  await verifyToken(req, res, next);
};

module.exports = {
  verifyToken,
  isAdmin,
  authenticate,
  verifyClerkToken
};