const express = require('express');
const router = express.Router();

// Import models
const User = require('../models/User');

// Import middleware
const { verifyFirebaseAuth, checkRole } = require('../middleware/auth');
const { 
  validateProfileUpdate, 
  validateObjectId, 
  validatePagination,
  validateSearch 
} = require('../middleware/validation');

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData.firebaseUid;
    delete updateData.email;
    delete updateData.role;
    delete updateData.isActive;
    delete updateData.isVerified;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        ...updateData,
        updatedBy: userId,
      },
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toSafeObject(),
      },
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

// @desc    Get user dashboard data
// @route   GET /api/users/dashboard
// @access  Private
const getUserDashboard = async (req, res) => {
  try {
    const user = req.user;
    const role = user.role;
    
    // Get role-specific dashboard data
    let dashboardData = {
      user: user.toSafeObject(),
      role,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount,
    };
    
    // Add role-specific data
    switch (role) {
      case 'anganwadi-worker':
        dashboardData.stats = {
          registeredChildren: 45,
          pregnantWomen: 12,
          dailyAttendance: '38/45',
          nutritionDistributed: 45,
        };
        break;
        
      case 'asha-volunteer':
        dashboardData.stats = {
          householdsVisited: 28,
          healthSessions: 12,
          referralsMade: 8,
          awarenessPrograms: 6,
        };
        break;
        
      case 'parent':
        dashboardData.stats = {
          myChildren: user.roleSpecificData?.parentDetails?.children?.length || 0,
          attendanceRate: '92%',
          vaccinations: '8/10',
          benefitsReceived: '₹2,400',
        };
        break;
        
      case 'adolescent-girl':
        dashboardData.stats = {
          bmiStatus: '18.5',
          hemoglobinLevel: '11.2 g/dL',
          ironTablets: '28/30',
          hygieneKits: 2,
        };
        break;
        
      case 'sanitation-worker':
        dashboardData.stats = {
          assignedRoutes: 8,
          collectionsToday: '6/8',
          pendingCollections: 2,
          issuesReported: 1,
        };
        break;
    }
    
    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Get user dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
    });
  }
};

// @desc    Get users by role (for AWW and ASHA workers)
// @route   GET /api/users/by-role/:role
// @access  Private (AWW, ASHA)
const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 10, district, block } = req.query;
    
    // Build query
    const query = { 
      role, 
      isActive: true 
    };
    
    if (district) {
      query['address.district'] = new RegExp(district, 'i');
    }
    
    if (block) {
      query['address.block'] = new RegExp(block, 'i');
    }
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-firebaseUid')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
      },
    });
  } catch (error) {
    console.error('Get users by role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
    });
  }
};

// @desc    Search users
// @route   GET /api/users/search
// @access  Private (AWW, ASHA)
const searchUsers = async (req, res) => {
  try {
    const { q, role, district, page = 1, limit = 10 } = req.query;
    
    // Build search query
    const query = { isActive: true };
    
    if (q) {
      query.$or = [
        { name: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') },
        { phone: new RegExp(q, 'i') },
      ];
    }
    
    if (role) {
      query.role = role;
    }
    
    if (district) {
      query['address.district'] = new RegExp(district, 'i');
    }
    
    // Execute search with pagination
    const users = await User.find(query)
      .select('-firebaseUid')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
        },
        query: { q, role, district },
      },
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
    });
  }
};

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (AWW, ASHA)
const getUserStats = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Get basic stats
    const totalUsers = await User.getActiveUsersCount();
    const roleStats = await User.getRoleStats();
    
    // Get location-based stats if user has location access
    let locationStats = null;
    if (['anganwadi-worker', 'asha-volunteer'].includes(userRole)) {
      const userDistrict = req.user.address?.district;
      if (userDistrict) {
        locationStats = await User.find({ 
          'address.district': userDistrict,
          isActive: true 
        }).countDocuments();
      }
    }
    
    res.json({
      success: true,
      data: {
        totalUsers,
        roleStats,
        locationStats,
        userRole,
      },
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
    });
  }
};

// @desc    Update user preferences
// @route   PUT /api/users/preferences
// @access  Private
const updateUserPreferences = async (req, res) => {
  try {
    const userId = req.user._id;
    const { preferences } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        preferences: {
          ...req.user.preferences,
          ...preferences,
        },
        updatedBy: userId,
      },
      { 
        new: true, 
        runValidators: true 
      }
    );
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
    });
  }
};

// @desc    Deactivate user account
// @route   DELETE /api/users/account
// @access  Private
const deactivateAccount = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Soft delete - mark as inactive
    await User.findByIdAndUpdate(userId, { 
      isActive: false,
      updatedBy: userId,
    });
    
    res.json({
      success: true,
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    console.error('Deactivate account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account',
    });
  }
};

// Routes
router.get('/profile', verifyFirebaseAuth, getUserProfile);
router.put('/profile', verifyFirebaseAuth, validateProfileUpdate, updateUserProfile);
router.get('/dashboard', verifyFirebaseAuth, getUserDashboard);
router.get('/by-role/:role', verifyFirebaseAuth, checkRole('anganwadi-worker', 'asha-volunteer'), getUsersByRole);
router.get('/search', verifyFirebaseAuth, checkRole('anganwadi-worker', 'asha-volunteer'), validateSearch, searchUsers);
router.get('/stats', verifyFirebaseAuth, checkRole('anganwadi-worker', 'asha-volunteer'), getUserStats);
router.put('/preferences', verifyFirebaseAuth, updateUserPreferences);
router.delete('/account', verifyFirebaseAuth, deactivateAccount);

module.exports = router;