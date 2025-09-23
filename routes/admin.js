const express = require('express');
const router = express.Router();

// Import models
const User = require('../models/User');
const Admin = require('../models/Admin');
const Child = require('../models/Child');
const PregnantWoman = require('../models/PregnantWoman');
const Adolescent = require('../models/Adolescent');
const Newborn = require('../models/Newborn');

// Import services
const emailService = require('../services/emailService');

// Import middleware
const { verifyAdminAuth, checkRole, checkPermission } = require('../middleware/auth');
const { 
  validateObjectId, 
  validatePagination,
  validateSearch,
  validateProfileUpdate 
} = require('../middleware/validation');

// Helper function to calculate time ago
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return new Date(date).toLocaleDateString();
};

// @desc    Get admin dashboard data
// @route   GET /api/admin/dashboard
// @access  Private (Admin)
const getAdminDashboard = async (req, res) => {
  try {
    // Get overall statistics
    const totalUsers = await User.getActiveUsersCount();
    const roleStats = await User.getRoleStats();

    // Get recent registrations
    const recentUsers = await User.find({ isActive: true })
      .select('-firebaseUid')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get real registration counts
    const [childrenCount, pregnantWomenCount, adolescentsCount, newbornsCount] = await Promise.all([
      Child.countDocuments({ status: 'active' }),
      PregnantWoman.countDocuments({ status: 'active' }),
      Adolescent.countDocuments({ status: 'active' }),
      Newborn.countDocuments({ status: 'active' })
    ]);

    // Get center-wise statistics
    const centerStats = await Promise.all([
      // Akkarakunnu Center
      {
        name: 'Akkarakunnu Anganwadi Center',
        code: 'AW-AK968',
        children: await Child.countDocuments({ anganwadiCenter: 'Akkarakunnu Anganwadi Center', status: 'active' }),
        pregnantWomen: await PregnantWoman.countDocuments({ anganwadiCenter: 'Akkarakunnu Anganwadi Center', status: 'active' }),
        adolescents: await Adolescent.countDocuments({ anganwadiCenter: 'Akkarakunnu Anganwadi Center', status: 'active' }),
        workers: await User.countDocuments({
          'roleSpecificData.anganwadiCenter.name': 'Akkarakunnu Anganwadi Center',
          role: 'anganwadi-worker',
          isActive: true
        })
      },
      // Veliyanoor Center
      {
        name: 'Veliyanoor Anganwadi Center',
        code: 'AK-VL969',
        children: await Child.countDocuments({ anganwadiCenter: 'Veliyanoor Anganwadi Center', status: 'active' }),
        pregnantWomen: await PregnantWoman.countDocuments({ anganwadiCenter: 'Veliyanoor Anganwadi Center', status: 'active' }),
        adolescents: await Adolescent.countDocuments({ anganwadiCenter: 'Veliyanoor Anganwadi Center', status: 'active' }),
        workers: await User.countDocuments({
          'roleSpecificData.anganwadiCenter.name': 'Veliyanoor Anganwadi Center',
          role: 'anganwadi-worker',
          isActive: true
        })
      }
    ]);

    // Calculate health alerts (high-risk pregnancies, underweight children, etc.)
    const healthAlerts = await Promise.all([
      PregnantWoman.countDocuments({
        status: 'active',
        $or: [
          { 'medicalHistory.complications': { $exists: true, $ne: [] } },
          { 'currentPregnancy.riskFactors': { $exists: true, $ne: [] } }
        ]
      }),
      Child.countDocuments({
        status: 'active',
        nutritionStatus: { $in: ['underweight', 'severely-underweight'] }
      }),
      Adolescent.countDocuments({
        status: 'active',
        'menstrualHealth.irregularCycles': true
      })
    ]);

    // Get system stats
    const stats = {
      totalAnganwadis: 2, // Your actual count
      registeredUsers: totalUsers,
      totalChildren: childrenCount,
      totalPregnantWomen: pregnantWomenCount,
      totalAdolescents: adolescentsCount,
      totalNewborns: newbornsCount,
      activeWorkers: await User.countDocuments({
        role: { $in: ['anganwadi-worker', 'asha-volunteer'] },
        isActive: true
      }),
      anganwadiWorkers: await User.countDocuments({
        role: 'anganwadi-worker',
        isActive: true
      }),
      ashaVolunteers: await User.countDocuments({
        role: 'asha-volunteer',
        isActive: true
      }),
      healthAlerts: healthAlerts.reduce((sum, count) => sum + count, 0),
      centerStats
    };
    
    // Get recent activities from actual data
    const recentActivities = [];

    // Get recent user registrations
    const recentUserRegistrations = await User.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(3)
      .select('name role createdAt roleSpecificData');

    recentUserRegistrations.forEach((user, index) => {
      const timeAgo = getTimeAgo(user.createdAt);
      const centerName = user.roleSpecificData?.anganwadiCenter?.name || 'Unknown Center';
      recentActivities.push({
        id: `user-${index}`,
        type: 'registration',
        message: `New ${user.role.replace('-', ' ')} "${user.name}" registered${user.role === 'anganwadi-worker' ? ` at ${centerName}` : ''}`,
        time: timeAgo,
        priority: 'medium'
      });
    });

    // Get recent child registrations
    const recentChildren = await Child.find({ status: 'active' })
      .sort({ enrollmentDate: -1 })
      .limit(2)
      .select('name anganwadiCenter enrollmentDate');

    recentChildren.forEach((child, index) => {
      const timeAgo = getTimeAgo(child.enrollmentDate);
      recentActivities.push({
        id: `child-${index}`,
        type: 'registration',
        message: `New child "${child.name}" enrolled at ${child.anganwadiCenter}`,
        time: timeAgo,
        priority: 'low'
      });
    });

    // Add health alerts if any
    if (stats.healthAlerts > 0) {
      recentActivities.unshift({
        id: 'health-alert',
        type: 'alert',
        message: `${stats.healthAlerts} health alerts require attention`,
        time: 'Now',
        priority: 'high'
      });
    }

    // Sort by priority and limit to 5 most recent
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    recentActivities.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    const limitedActivities = recentActivities.slice(0, 5);
    
    res.json({
      success: true,
      data: {
        stats,
        roleStats,
        recentUsers,
        recentActivities: limitedActivities,
        lastUpdated: new Date().toISOString()
      },
    });
  } catch (error) {
    console.error('Get admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get dashboard data',
    });
  }
};

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role, 
      district, 
      isActive = 'true',
      sort = '-createdAt' 
    } = req.query;
    
    // Build query
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (district) {
      query['address.district'] = new RegExp(district, 'i');
    }
    
    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    }
    
    // Execute query with pagination
    const users = await User.find(query)
      .select('-firebaseUid')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort(sort)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit),
        },
        filters: { role, district, isActive, sort },
      },
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id)
      .select('-firebaseUid')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user',
    });
  }
};

// @desc    Update user by ID
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
const updateUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const adminId = req.admin._id;
    
    // Remove fields that shouldn't be updated
    delete updateData.firebaseUid;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    const user = await User.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updatedBy: adminId,
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-firebaseUid');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
};

// @desc    Delete/Deactivate user by ID
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent = false } = req.query;
    const adminId = req.admin._id;
    
    if (permanent === 'true') {
      // Permanent deletion (use with caution)
      const user = await User.findByIdAndDelete(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      
      res.json({
        success: true,
        message: 'User permanently deleted',
      });
    } else {
      // Soft delete - mark as inactive
      const user = await User.findByIdAndUpdate(
        id,
        { 
          isActive: false,
          updatedBy: adminId,
        },
        { new: true }
      ).select('-firebaseUid');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }
      
      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: {
          user,
        },
      });
    }
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};

// @desc    Reactivate user by ID
// @route   PUT /api/admin/users/:id/reactivate
// @access  Private (Admin)
const reactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;
    
    const user = await User.findByIdAndUpdate(
      id,
      { 
        isActive: true,
        updatedBy: adminId,
      },
      { new: true }
    ).select('-firebaseUid');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      message: 'User reactivated successfully',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Reactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate user',
    });
  }
};

// @desc    Search users
// @route   GET /api/admin/users/search
// @access  Private (Admin)
const searchUsers = async (req, res) => {
  try {
    const { q, role, district, page = 1, limit = 10 } = req.query;
    
    // Build search query
    const query = {};
    
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
          current: parseInt(page),
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

// @desc    Get system statistics
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.getActiveUsersCount();
    const roleStats = await User.getRoleStats();
    
    // Get registration trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      isActive: true,
    });
    
    // Get district-wise stats
    const districtStats = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { 
        _id: '$address.district', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    res.json({
      success: true,
      data: {
        totalUsers,
        roleStats,
        recentRegistrations,
        districtStats,
        systemHealth: {
          status: 'healthy',
          uptime: process.uptime(),
          memory: process.memoryUsage(),
        },
      },
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
    });
  }
};

// @desc    Export users data
// @route   GET /api/admin/users/export
// @access  Private (Admin)
const exportUsers = async (req, res) => {
  try {
    const { format = 'json', role, district } = req.query;
    
    // Build query
    const query = { isActive: true };
    
    if (role) {
      query.role = role;
    }
    
    if (district) {
      query['address.district'] = new RegExp(district, 'i');
    }
    
    // Get users data
    const users = await User.find(query)
      .select('-firebaseUid -__v')
      .sort({ createdAt: -1 });
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(users);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
      res.send(csv);
    } else {
      // Return JSON format
      res.json({
        success: true,
        data: {
          users,
          exportedAt: new Date().toISOString(),
          filters: { role, district },
        },
      });
    }
  } catch (error) {
    console.error('Export users error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed',
    });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  if (!data.length) return '';

  const headers = [
    'Name',
    'Email',
    'Phone',
    'Role',
    'District',
    'Block',
    'Village',
    'Anganwadi Center',
    'Status',
    'Verified',
    'Created At',
    'Last Login'
  ];
  const csvRows = [headers.join(',')];

  data.forEach(user => {
    const row = [
      user.name || '',
      user.email || '',
      user.phone || '',
      user.role || '',
      user.address?.district || '',
      user.address?.block || '',
      user.address?.village || '',
      user.roleSpecificData?.anganwadiCenter?.name || '',
      user.isActive ? 'Active' : 'Inactive',
      user.isVerified ? 'Verified' : 'Unverified',
      user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '',
      user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'
    ];
    // Escape commas in values
    const escapedRow = row.map(value => {
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csvRows.push(escapedRow.join(','));
  });

  return csvRows.join('\n');
};

// @desc    Create new user by admin
// @route   POST /api/admin/users
// @access  Private (Admin)
const createUserByAdmin = async (req, res) => {
  try {
    const { name, email, phone, role, location, roleSpecificData } = req.body;
    const adminId = req.admin._id;
    
    // Generate temporary password
    const tempPassword = generateRandomPassword();
    
    // Create user data
    const userData = {
      name,
      email,
      phone,
      role,
      address: {
        street: location || '',
        city: '',
        state: '',
        pincode: '',
        district: '',
        block: '',
      },
      roleSpecificData: roleSpecificData || {},
      isActive: true,
      createdBy: adminId,
      tempPassword: tempPassword, // Store temporarily for email
    };
    
    // Create user in database
    const newUser = new User(userData);
    await newUser.save();
    
    // Send email with credentials
    await sendCredentialsEmail(email, name, email, tempPassword);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully and credentials sent via email',
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          isActive: newUser.isActive,
        },
      },
    });
  } catch (error) {
    console.error('Create user by admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
    });
  }
};

// Helper function to generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Helper function to send credentials email
const sendCredentialsEmail = async (email, name, username, password) => {
  try {
    const result = await emailService.sendCredentialsEmail(email, name, username, password);
    return result;
  } catch (error) {
    console.error('Email sending error:', error);
    // Don't throw error to prevent user creation failure if email fails
    // Log the error and continue
    return { success: false, error: error.message };
  }
};

// ============= WORKER MANAGEMENT FUNCTIONS =============

// @desc    Get all workers
// @route   GET /api/admin/workers
// @access  Private (Admin only)
const getWorkers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    
    // Build query
    let query = {
      role: { $in: ['anganwadi-worker', 'asha-volunteer', 'sanitation-worker'] }
    };
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Execute query with pagination
    const workers = await User.find(query)
      .select('-hashedPassword -tempPassword')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);
    
    res.json({
      success: true,
      data: workers,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
    
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workers'
    });
  }
};

// @desc    Create new worker account
// @route   POST /api/admin/workers
// @access  Private (Admin only)
const createWorker = async (req, res) => {
  try {
    console.log('Creating worker with data:', req.body);
    
    const {
      name,
      email,
      phone,
      role,
      address,
      roleSpecificData,
      customPassword,
      useCustomPassword = false
    } = req.body;
    
    // Validate required fields
    if (!name || !email || !role) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and role are required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Generate or use custom password
    let tempPassword;
    let passwordToSend;
    
    if (useCustomPassword && customPassword) {
      // Validate custom password
      if (customPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Custom password must be at least 6 characters long'
        });
      }
      tempPassword = customPassword;
      passwordToSend = customPassword;
    } else {
      // Generate temporary password
      tempPassword = Math.random().toString(36).slice(-8) + 'A1!';
      passwordToSend = tempPassword;
    }
    
    // Create user data
    const userData = {
      firebaseUid: `admin-created-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone || '',
      role,
      address: {
        street: address?.street || '',
        city: address?.city || '',
        state: address?.state || '',
        pincode: address?.pincode || '',
        district: address?.district || '',
        block: address?.block || ''
      },
      roleSpecificData: roleSpecificData || {},
      tempPassword,
      isActive: true,
      isVerified: false,
      createdBy: req.admin?._id || 'admin',
      preferences: {
        language: 'en',
        notifications: {
          email: true,
          sms: true,
          push: true,
        },
      },
    };
    
    console.log('Creating user with data:', userData);
    
    const user = new User(userData);
    await user.save();
    
    console.log('✅ Worker account created:', user.email);
    
    // Send welcome email with credentials
    try {
      await sendWorkerWelcomeEmail(user, passwordToSend);
      console.log('✅ Welcome email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail the worker creation if email fails
    }
    
    res.status(201).json({
      success: true,
      message: `Worker account created successfully${useCustomPassword ? ' with custom password' : ' with auto-generated password'}. Login credentials have been sent via email.`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          isActive: user.isActive,
          createdAt: user.createdAt,
          hasCustomPassword: useCustomPassword
        }
      }
    });
    
  } catch (error) {
    console.error('Create worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create worker account: ' + error.message
    });
  }
};

// @desc    Update worker account
// @route   PUT /api/admin/workers/:id
// @access  Private (Admin only)
const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields from update
    delete updateData.tempPassword;
    delete updateData.hashedPassword;
    delete updateData.firebaseUid;
    
    const user = await User.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        updatedBy: req.admin._id
      },
      { new: true, runValidators: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Worker updated successfully',
      data: user.toSafeObject ? user.toSafeObject() : user
    });
    
  } catch (error) {
    console.error('Update worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update worker'
    });
  }
};

// @desc    Toggle worker status (activate/deactivate)
// @route   PATCH /api/admin/workers/:id/toggle-status
// @access  Private (Admin only)
const toggleWorkerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    user.isActive = !user.isActive;
    user.updatedBy = req.admin._id;
    await user.save();
    
    console.log(`✅ Worker ${user.email} ${user.isActive ? 'activated' : 'deactivated'} by admin: ${req.admin.email}`);
    
    res.json({
      success: true,
      message: `Worker ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { isActive: user.isActive }
    });
    
  } catch (error) {
    console.error('Toggle worker status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update worker status'
    });
  }
};

// @desc    Resend worker credentials
// @route   POST /api/admin/workers/:id/resend-credentials
// @access  Private (Admin only)
const resendWorkerCredentials = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    // Generate new temporary password if user hasn't set permanent password
    let tempPassword = user.tempPassword;
    if (!tempPassword) {
      tempPassword = generateRandomPassword();
      user.tempPassword = tempPassword;
      await user.save();
    }
    
    // Send credentials email
    await sendWorkerWelcomeEmail(user, tempPassword);
    
    console.log(`✅ Credentials resent to ${user.email} by admin: ${req.admin.email}`);
    
    res.json({
      success: true,
      message: 'Credentials sent successfully'
    });
    
  } catch (error) {
    console.error('Resend credentials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend credentials'
    });
  }
};

// @desc    Reset worker password
// @route   POST /api/admin/workers/:id/reset-password
// @access  Private (Admin only)
const resetWorkerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword, useCustomPassword = false } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    let passwordToSet;
    let passwordToSend;
    
    if (useCustomPassword && newPassword) {
      // Validate custom password
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
      }
      passwordToSet = newPassword;
      passwordToSend = newPassword;
    } else {
      // Generate new temporary password
      passwordToSet = generateRandomPassword();
      passwordToSend = passwordToSet;
    }
    
    // Update user password
    user.tempPassword = passwordToSet;
    user.hashedPassword = null; // Reset any existing hashed password
    user.updatedBy = req.admin._id;
    await user.save();
    
    // Send new credentials email
    await sendWorkerWelcomeEmail(user, passwordToSend);
    
    console.log(`✅ Password reset for ${user.email} by admin: ${req.admin.email}`);
    
    res.json({
      success: true,
      message: `Password ${useCustomPassword ? 'set' : 'reset'} successfully. New credentials have been sent via email.`,
      data: {
        hasCustomPassword: useCustomPassword
      }
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// @desc    Delete worker account
// @route   DELETE /api/admin/workers/:id
// @access  Private (Admin only)
const deleteWorker = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    // Soft delete - just deactivate
    user.isActive = false;
    user.updatedBy = req.admin._id;
    await user.save();
    
    console.log(`✅ Worker ${user.email} deleted by admin: ${req.admin.email}`);
    
    res.json({
      success: true,
      message: 'Worker account deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete worker error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete worker'
    });
  }
};

// @desc    Get worker statistics
// @route   GET /api/admin/workers/stats
// @access  Private (Admin only)
const getWorkerStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $match: {
          role: { $in: ['anganwadi-worker', 'asha-volunteer', 'sanitation-worker'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
          inactive: { $sum: { $cond: ['$isActive', 0, 1] } },
          pendingSetup: { $sum: { $cond: [{ $ne: ['$tempPassword', null] }, 1, 0] } },
          byRole: {
            $push: {
              role: '$role',
              isActive: '$isActive',
              hasTempPassword: { $ne: ['$tempPassword', null] }
            }
          }
        }
      }
    ]);
    
    const roleStats = {};
    if (stats[0]) {
      stats[0].byRole.forEach(worker => {
        if (!roleStats[worker.role]) {
          roleStats[worker.role] = { total: 0, active: 0, pendingSetup: 0 };
        }
        roleStats[worker.role].total++;
        if (worker.isActive) roleStats[worker.role].active++;
        if (worker.hasTempPassword) roleStats[worker.role].pendingSetup++;
      });
    }
    
    res.json({
      success: true,
      data: {
        overview: stats[0] || { total: 0, active: 0, inactive: 0, pendingSetup: 0 },
        byRole: roleStats
      }
    });
    
  } catch (error) {
    console.error('Get worker stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker statistics'
    });
  }
};

// Helper function to send welcome email
const sendWorkerWelcomeEmail = async (user, tempPassword) => {
  const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to SampoornaAangan</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Your worker account has been created</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
        <h2 style="color: #333; margin-top: 0;">Hello ${user.name},</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Your account has been created by the Panchayat Officer for the SampoornaAangan portal. 
          You can now access the system using the credentials below:
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Your Login Credentials:</h3>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> <code style="background: #e9ecef; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
          <p style="margin: 5px 0;"><strong>Role:</strong> ${user.role.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Login to Portal
          </a>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">🔐 Important Security Notice:</h4>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>This is a temporary password for your first login</li>
            <li>You will be prompted to set a new secure password</li>
            <li>Please keep your credentials confidential</li>
            <li>Contact your administrator if you face any issues</li>
          </ul>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Once you log in, you'll have access to your dashboard where you can:
        </p>
        
        <ul style="color: #666; line-height: 1.6;">
          ${user.role === 'anganwadi-worker' ? `
            <li>Record child health statistics and growth data</li>
            <li>Track attendance and nutrition programs</li>
            <li>Manage beneficiary information</li>
          ` : user.role === 'asha-volunteer' ? `
            <li>Update maternal care visit records</li>
            <li>Record health screening information</li>
            <li>Track community health programs</li>
          ` : `
            <li>Report hygiene activities and maintenance</li>
            <li>Track sanitation facility status</li>
            <li>Submit maintenance requests</li>
          `}
        </ul>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="color: #999; font-size: 14px; text-align: center; margin: 0;">
          This email was sent by SampoornaAangan Portal<br>
          If you have any questions, please contact your administrator.
        </p>
      </div>
    </div>
  `;
  
  // Use existing email service
  return await emailService.sendEmail({
    to: user.email,
    subject: 'Welcome to SampoornaAangan - Your Account Details',
    html: emailContent
  });
};

// Worker Management Routes
router.get('/workers', verifyAdminAuth, checkRole('super-admin'), getWorkers);
router.post('/workers', verifyAdminAuth, checkRole('super-admin'), createWorker);
router.put('/workers/:id', verifyAdminAuth, checkRole('super-admin'), validateObjectId, updateWorker);
router.patch('/workers/:id/toggle-status', verifyAdminAuth, checkRole('super-admin'), validateObjectId, toggleWorkerStatus);
router.post('/workers/:id/resend-credentials', verifyAdminAuth, checkRole('super-admin'), validateObjectId, resendWorkerCredentials);
router.post('/workers/:id/reset-password', verifyAdminAuth, checkRole('super-admin'), validateObjectId, resetWorkerPassword);
router.delete('/workers/:id', verifyAdminAuth, checkRole('super-admin'), validateObjectId, deleteWorker);
router.get('/workers/stats', verifyAdminAuth, checkRole('super-admin'), getWorkerStats);

// User Management Routes
router.get('/dashboard', verifyAdminAuth, checkRole('super-admin'), getAdminDashboard);
router.get('/users', verifyAdminAuth, checkRole('super-admin'), validatePagination, getAllUsers);
router.post('/users', verifyAdminAuth, checkRole('super-admin'), createUserByAdmin);
router.get('/users/search', verifyAdminAuth, checkRole('super-admin'), validateSearch, searchUsers);
router.get('/users/export', verifyAdminAuth, checkRole('super-admin'), exportUsers);
router.get('/users/:id', verifyAdminAuth, checkRole('super-admin'), validateObjectId, getUserById);
router.put('/users/:id', verifyAdminAuth, checkRole('super-admin'), validateObjectId, validateProfileUpdate, updateUserById);
router.delete('/users/:id', verifyAdminAuth, checkRole('super-admin'), validateObjectId, deleteUserById);
router.put('/users/:id/reactivate', verifyAdminAuth, checkRole('super-admin'), validateObjectId, reactivateUser);
router.get('/stats', verifyAdminAuth, checkRole('super-admin'), getSystemStats);

module.exports = router;
