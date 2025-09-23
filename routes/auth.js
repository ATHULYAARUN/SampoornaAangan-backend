const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import models
const User = require('../models/User');
const Admin = require('../models/Admin');

// Import Firebase config
const { createFirebaseUser, verifyFirebaseToken } = require('../config/firebase');

// Import middleware
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validateAdminLogin,
  validateRoleSpecificData 
} = require('../middleware/validation');
const { generateAdminToken, verifyUserAuth } = require('../middleware/auth');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      address,
      roleSpecificData,
      preferences
    } = req.body;

    console.log('📝 Registration attempt:', { name, email, role, hasPhone: !!phone });

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    let firebaseUid = null;

    // Try to create user in Firebase (if available)
    try {
      const firebaseUser = await createFirebaseUser({
        name,
        email,
        password,
        role,
      });
      firebaseUid = firebaseUser.uid;
      console.log('✅ Firebase user created successfully');
    } catch (firebaseError) {
      console.warn('⚠️ Firebase user creation failed:', firebaseError.message);
      console.log('📝 Continuing with direct registration...');
      // Generate a unique ID for non-Firebase users
      firebaseUid = `direct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Hash password for direct authentication (if Firebase failed)
    let hashedPassword = null;
    if (!firebaseUid.startsWith('direct-')) {
      // Firebase user - no need to hash password
      console.log('✅ Firebase user - password handled by Firebase');
    } else {
      // Direct user - hash password for database storage
      const saltRounds = 12;
      hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('✅ Password hashed for direct authentication');
    }

    // Create user in MongoDB
    const userData = {
      firebaseUid: firebaseUid,
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone || '',
      role,
      address: address || {},
      roleSpecificData: roleSpecificData || {},
      preferences: {
        language: preferences?.language || 'en',
        notifications: {
          email: preferences?.notifications?.email !== false,
          sms: preferences?.notifications?.sms !== false,
          push: preferences?.notifications?.push !== false,
        },
      },
      isActive: true,
      isVerified: false, // Will be verified via Firebase email verification or admin approval
      // Add hashed password for direct users
      ...(hashedPassword && { hashedPassword })
    };

    const user = new User(userData);
    await user.save();

    console.log('✅ User registered successfully:', user.email);

    // Return success response (don't include sensitive data)
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toSafeObject ? user.toSafeObject() : {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isVerified: user.isVerified
        },
        firebaseUid: firebaseUid,
        authMethod: firebaseUid.startsWith('direct-') ? 'direct' : 'firebase'
      },
    });

  } catch (error) {
    console.error('❌ User registration error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    
    // Handle specific Firebase errors
    if (error.code && error.code.startsWith('auth/')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `User with this ${field} already exists`,
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
};

// @desc    Login user with Firebase or direct credentials
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { idToken, role, email, password } = req.body;
    console.log('Login attempt:', { hasIdToken: !!idToken, email, role, hasPassword: !!password });

    let user = null;
    let authMethod = null;

    // Method 1: Firebase Authentication (Primary)
    if (idToken) {
      try {
        console.log('🔥 Attempting Firebase authentication...');
        const decodedToken = await verifyFirebaseToken(idToken);
        
        // Find user in MongoDB by Firebase UID
        user = await User.findOne({ 
          firebaseUid: decodedToken.uid,
          isActive: true 
        });

        if (user) {
          console.log('✅ Firebase authentication successful');
          authMethod = 'firebase';
        } else {
          console.log('⚠️ Firebase user not found in MongoDB');
        }
      } catch (firebaseError) {
        console.warn('❌ Firebase authentication failed:', firebaseError.message);
      }
    }

    // Method 2: Direct Email/Password (Fallback for admin-created users)
    if (!user && email && password) {
      console.log('🔑 Attempting direct email/password authentication...');
      
      // Find user by email
      user = await User.findOne({ 
        email: email.toLowerCase(),
        isActive: true 
      });

      if (!user) {
        console.log('❌ User not found:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password',
        });
      }

      // Check authentication method
      if (user.tempPassword) {
        // Admin-created user with temporary password
        if (user.tempPassword !== password) {
          console.log('❌ Temporary password mismatch');
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
          });
        }
        console.log('✅ Temporary password authentication successful');
        authMethod = 'temp-password';
      } else if (user.hashedPassword) {
        // Self-registered user with hashed password
        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isPasswordValid) {
          console.log('❌ Hashed password mismatch');
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password',
          });
        }
        console.log('✅ Hashed password authentication successful');
        authMethod = 'direct';
      } else {
        console.log('❌ No authentication method available for this user');
        return res.status(401).json({
          success: false,
          message: 'Please register through the registration page or contact admin',
        });
      }
    }

    // Check if authentication was successful
    if (!user) {
      console.log('❌ Authentication failed - no valid method');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your email, password, and selected role.',
      });
    }

    // Verify role matches
    if (role && user.role !== role) {
      console.log('❌ Role mismatch:', { userRole: user.role, requestedRole: role });
      return res.status(401).json({
        success: false,
        message: `Role mismatch. This account is registered as ${user.role}. Please select the correct role.`,
      });
    }

    console.log(`✅ Authentication successful for ${user.email} via ${authMethod}`);

    // Update last login
    if (user.updateLastLogin) {
      await user.updateLastLogin();
    }

    // Generate JWT token for session management
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        authMethod: authMethod
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return user data
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toSafeObject ? user.toSafeObject() : {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isVerified: user.isVerified
        },
        token: token,
        firebaseToken: idToken || null,
        role: user.role,
        authMethod: authMethod,
        dashboard: getDashboardRoute(user.role),
        needsPasswordChange: authMethod === 'temp-password'
      },
    });

  } catch (error) {
    console.error('❌ User login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

// @desc    Login admin
// @route   POST /api/auth/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Find admin by username or email
    const admin = await Admin.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() }
      ],
      isActive: true
    });
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = generateAdminToken(admin._id);

    // Return admin data
    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        },
        token,
        dashboard: '/admin-dashboard',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    // For Firebase users, logout is handled on the client side
    // We can add any server-side cleanup here if needed
    
    res.json({
      success: true,
      message: 'Logout successful',
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

// @desc    Logout admin
// @route   POST /api/auth/admin/logout
// @access  Private (Admin)
const logoutAdmin = async (req, res) => {
  try {
    const admin = req.admin;
    const token = req.headers.authorization?.substring(7);
    
    if (token && admin) {
      // Remove session from admin record
      await admin.removeSession(token);
    }
    
    res.json({
      success: true,
      message: 'Admin logout successful',
    });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
    });
  }
};

// @desc    Verify token and get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
        role: user.role,
        dashboard: getDashboardRoute(user.role),
      },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
    });
  }
};

// @desc    Google Sign-in
// @route   POST /api/auth/google-login
// @access  Public
const googleLogin = async (req, res) => {
  try {
    const { idToken, role, userData } = req.body;
    console.log('Google login attempt:', { email: userData.email, role });

    // Verify Firebase token
    const decodedToken = await verifyFirebaseToken(idToken);
    
    // First, try to find user by Firebase UID
    let user = await User.findOne({ 
      firebaseUid: decodedToken.uid,
      isActive: true 
    });

    let isNewUser = false;

    if (!user) {
      // If not found by Firebase UID, try to find by email
      user = await User.findOne({ 
        email: userData.email.toLowerCase(),
        isActive: true 
      });

      if (user) {
        // Update existing user's Firebase UID
        user.firebaseUid = decodedToken.uid;
        await user.save();
        console.log('✅ Existing user found by email and Firebase UID updated');
      } else {
        // Create new user from Google data
        console.log('Creating new user from Google Sign-in');
        
        user = new User({
          firebaseUid: decodedToken.uid,
          name: userData.name || userData.email.split('@')[0],
          email: userData.email.toLowerCase(),
          role: role,
          isActive: true,
          isVerified: userData.emailVerified || false,
          profilePicture: userData.photoURL || null,
          address: {},
          roleSpecificData: {},
          preferences: {
            language: 'en',
            notifications: {
              email: true,
              sms: false,
              push: true,
            },
          }
        });

        await user.save();
        isNewUser = true;
        console.log('✅ New user created from Google Sign-in');
      }
    } else {
      console.log('✅ Existing user found by Firebase UID');
    }

    // Verify role matches (for existing users)
    if (!isNewUser && role && user.role !== role) {
      console.log('❌ Role mismatch:', { userRole: user.role, requestedRole: role });
      return res.status(401).json({
        success: false,
        message: `Role mismatch. This account is registered as ${user.role}. Please select the correct role.`,
      });
    }

    // Update last login
    if (user.updateLastLogin) {
      await user.updateLastLogin();
    }

    // Generate JWT token for session management
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        authMethod: 'google'
      },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );

    // Return user data
    res.json({
      success: true,
      message: isNewUser ? 'Account created and login successful' : 'Login successful',
      data: {
        user: user.toSafeObject ? user.toSafeObject() : {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          profilePicture: user.profilePicture
        },
        token: token,
        firebaseToken: idToken,
        role: user.role,
        authMethod: 'google',
        dashboard: getDashboardRoute(user.role),
        isNewUser: isNewUser
      },
    });

  } catch (error) {
    console.error('❌ Google login error:', error);
    res.status(500).json({
      success: false,
      message: 'Google login failed. Please try again.',
    });
  }
};

// @desc    Verify admin token and get admin data
// @route   GET /api/auth/admin/me
// @access  Private (Admin)
const getAdminMe = async (req, res) => {
  try {
    const admin = req.admin;
    
    res.json({
      success: true,
      data: {
        admin: admin.toSafeObject(),
        role: admin.role,
        permissions: admin.permissions,
        dashboard: '/admin-dashboard',
      },
    });
  } catch (error) {
    console.error('Get admin me error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get admin data',
    });
  }
};

// Helper function to get dashboard route based on role
const getDashboardRoute = (role) => {
  const dashboardRoutes = {
    'super-admin': '/admin-dashboard',
    'anganwadi-worker': '/aww-dashboard',
    'asha-volunteer': '/asha-dashboard',
    'parent': '/parent-dashboard',
    'adolescent-girl': '/adolescent-dashboard',
    'sanitation-worker': '/sanitation-dashboard',
  };
  
  return dashboardRoutes[role] || '/dashboard';
};

// @desc    Change password (for first-time login or regular password change)
// @route   POST /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    let isCurrentPasswordValid = false;
    
    if (user.tempPassword) {
      // User has temporary password (first-time login)
      isCurrentPasswordValid = user.tempPassword === currentPassword;
    } else if (user.hashedPassword) {
      // User has permanent password
      isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);
    }

    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    user.hashedPassword = hashedNewPassword;
    user.tempPassword = null; // Remove temporary password
    await user.save();

    console.log(`✅ Password changed successfully for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password changed successfully',
      data: {
        passwordChanged: true,
        isFirstTimeLogin: false
      }
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

// Routes
router.post('/register', validateUserRegistration, validateRoleSpecificData, registerUser);
router.post('/login', loginUser);
router.post('/google-login', googleLogin);
router.post('/admin/login', validateAdminLogin, loginAdmin);
router.post('/change-password', verifyUserAuth, changePassword);
router.post('/logout', logoutUser);
router.post('/admin/logout', logoutAdmin);
router.get('/me', getMe);
router.get('/admin/me', getAdminMe);

module.exports = router;
