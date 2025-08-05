const jwt = require('jsonwebtoken');
const { verifyFirebaseToken } = require('../config/firebase');
const User = require('../models/User');
const Admin = require('../models/Admin');

// Middleware to verify Firebase token for regular users
const verifyFirebaseAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(token);
    
    // Find user in database
    const user = await User.findOne({ 
      firebaseUid: decodedToken.uid,
      isActive: true 
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.',
      });
    }
    
    // Add user info to request
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error('Firebase auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

// Middleware to verify JWT token for regular users
const verifyUserAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Find user in database
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive.',
      });
    }
    
    // Add user info to request
    req.user = user;
    
    next();
  } catch (error) {
    console.error('User auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
    });
  }
};

// Middleware to verify JWT token for admin users
const verifyAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
      });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find admin in database
    const admin = await Admin.findById(decoded.id).select('-password');
    
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Admin not found or inactive.',
      });
    }
    
    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to failed login attempts.',
      });
    }
    
    // Add admin info to request
    req.admin = admin;
    req.user = admin; // For compatibility
    
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
    });
  }
};

// Middleware to check user roles
const checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      const userRole = req.user?.role || req.admin?.role;
      
      if (!userRole) {
        return res.status(401).json({
          success: false,
          message: 'User role not found.',
        });
      }
      
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          requiredRoles: allowedRoles,
          userRole: userRole,
        });
      }
      
      next();
    } catch (error) {
      console.error('Role check middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Role verification failed.',
      });
    }
  };
};

// Middleware to check admin permissions
const checkPermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: 'Admin authentication required.',
        });
      }
      
      if (!req.admin.hasPermission(permission)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.',
          requiredPermission: permission,
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission check middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission verification failed.',
      });
    }
  };
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }
    
    const token = authHeader.substring(7);
    
    try {
      // Try Firebase token first
      const decodedToken = await verifyFirebaseToken(token);
      const user = await User.findOne({ 
        firebaseUid: decodedToken.uid,
        isActive: true 
      });
      
      if (user) {
        req.user = user;
        req.firebaseUser = decodedToken;
        return next();
      }
    } catch (firebaseError) {
      // Try JWT token for admin
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const admin = await Admin.findById(decoded.id).select('-password');
        
        if (admin && admin.isActive && !admin.isLocked) {
          req.admin = admin;
          req.user = admin;
        }
      } catch (jwtError) {
        // Ignore JWT errors in optional auth
      }
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue even if there's an error
  }
};

// Middleware to generate JWT token for admin
const generateAdminToken = (adminId) => {
  return jwt.sign(
    { id: adminId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Middleware to validate request origin
const validateOrigin = (req, res, next) => {
  const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://your-frontend-domain.com']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];
  
  const origin = req.headers.origin;
  
  if (!origin || allowedOrigins.includes(origin)) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Invalid origin.',
    });
  }
};

module.exports = {
  verifyFirebaseAuth,
  verifyUserAuth,
  verifyAdminAuth,
  checkRole,
  checkPermission,
  optionalAuth,
  generateAdminToken,
  validateOrigin,
};