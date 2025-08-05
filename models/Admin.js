const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [50, 'Username cannot exceed 50 characters'],
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address',
    ],
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
  
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  
  role: {
    type: String,
    default: 'super-admin',
    enum: ['super-admin'],
  },
  
  permissions: {
    type: [String],
    default: [
      'users:read',
      'users:write',
      'users:delete',
      'anganwadis:read',
      'anganwadis:write',
      'anganwadis:delete',
      'reports:read',
      'reports:write',
      'settings:read',
      'settings:write',
      'system:admin'
    ],
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: null,
  },
  
  phone: {
    type: String,
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
  },
  
  // Location/Jurisdiction
  jurisdiction: {
    state: String,
    district: String,
    block: String,
    panchayat: String,
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  isVerified: {
    type: Boolean,
    default: true,
  },
  
  // Security
  lastLogin: {
    type: Date,
    default: null,
  },
  
  loginCount: {
    type: Number,
    default: 0,
  },
  
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  
  lockUntil: {
    type: Date,
    default: null,
  },
  
  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Two-factor authentication
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  
  twoFactorSecret: String,
  
  // Session management
  activeSessions: [{
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    createdAt: { type: Date, default: Date.now },
    lastActivity: { type: Date, default: Date.now },
  }],
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
adminSchema.index({ username: 1 });
adminSchema.index({ email: 1 });
adminSchema.index({ isActive: 1 });
adminSchema.index({ createdAt: -1 });

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Add this method to compare passwords
adminSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Add password hashing middleware
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

adminSchema.methods.updateLastLogin = async function(sessionInfo = {}) {
  this.lastLogin = new Date();
  this.loginCount += 1;
  this.failedLoginAttempts = 0;
  this.lockUntil = undefined;
  
  // Add session info if provided
  if (sessionInfo.sessionId) {
    this.activeSessions.push({
      sessionId: sessionInfo.sessionId,
      ipAddress: sessionInfo.ipAddress,
      userAgent: sessionInfo.userAgent,
    });
    
    // Keep only last 5 sessions
    if (this.activeSessions.length > 5) {
      this.activeSessions = this.activeSessions.slice(-5);
    }
  }
  
  return this.save();
};

adminSchema.methods.incrementFailedLogin = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { failedLoginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { failedLoginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.failedLoginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

adminSchema.methods.toSafeObject = function() {
  const adminObject = this.toObject();
  
  // Remove sensitive information
  delete adminObject.password;
  delete adminObject.twoFactorSecret;
  delete adminObject.resetPasswordToken;
  delete adminObject.activeSessions;
  delete adminObject.__v;
  
  return adminObject;
};

adminSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.permissions.includes('system:admin');
};

adminSchema.methods.removeSession = function(sessionId) {
  this.activeSessions = this.activeSessions.filter(
    session => session.sessionId !== sessionId
  );
  return this.save();
};

// Static methods
adminSchema.statics.findByUsernameOrEmail = function(identifier) {
  return this.findOne({
    $or: [
      { username: identifier.toLowerCase() },
      { email: identifier.toLowerCase() }
    ],
    isActive: true
  });
};

adminSchema.statics.createDefaultAdmin = async function() {
  try {
    const existingAdmin = await this.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('Default admin already exists');
      return existingAdmin;
    }
    
    const defaultAdmin = new this({
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@sampoornaangan.gov.in',
      password: process.env.ADMIN_PASSWORD || 'admin',
      name: 'Super Administrator',
      role: 'super-admin',
      isVerified: true,
      isActive: true,
    });
    
    await defaultAdmin.save();
    console.log('✅ Default admin created successfully');
    return defaultAdmin;
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
    throw error;
  }
};

// Create and export model
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
