const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Firebase UID (optional for direct login users)
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true, // Allow multiple null values
  },
  
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
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
  
  phone: {
    type: String,
    trim: true,
    match: [/^(\+91\s?)?[0-9]{10}$/, 'Please enter a valid phone number'],
  },

  // Enhanced fields for Anganwadi Workers
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    validate: {
      validator: function(value) {
        // Only validate gender restriction for anganwadi-worker role
        if (this.role === 'anganwadi-worker' && value !== 'female') {
          return false;
        }
        return true;
      },
      message: 'Only female staff are allowed to be registered as Anganwadi workers.'
    }
  },

  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        const age = Math.floor((Date.now() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        return age >= 18;
      },
      message: 'Worker must be at least 18 years old'
    }
  },

  qualification: {
    type: String,
    enum: ['10th-pass', '12th-pass', 'graduate', 'postgraduate']
  },

  // Employment Details
  dateOfJoining: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        return value <= new Date(); // Cannot be in future
      },
      message: 'Date of joining cannot be in the future'
    }
  },

  designation: {
    type: String,
    enum: ['worker', 'helper', 'supervisor']
  },

  experience: {
    type: Number,
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years']
  },

  // Emergency Contact
  alternatePhone: {
    type: String,
    trim: true,
    match: [/^(\+91\s?)?[0-9]{10}$/, 'Please enter a valid alternate phone number'],
  },

  emergencyContactPerson: {
    type: String,
    trim: true,
    maxlength: [100, 'Emergency contact person name cannot exceed 100 characters'],
  },

  // Worker Photo
  workerPhoto: {
    type: String, // Will store file path or URL
    default: null,
  },
  
  // Role-based Information
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: {
      values: [
        'super-admin',
        'anganwadi-worker',
        'asha-volunteer',
        'parent',
        'adolescent-girl',
        'sanitation-worker'
      ],
      message: 'Invalid role selected',
    },
  },
  
  // Location Information
  address: {
    street: String,
    city: String,
    state: String,
    pincode: {
      type: String,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'],
    },
    district: String,
    block: String,
    village: String,
  },
  
  // Role-specific Information
  roleSpecificData: {
    // For Anganwadi Worker
    anganwadiCenter: {
      name: String,
      code: String,
      location: String,
    },
    
    // For ASHA Worker
    ashaDetails: {
      certificationNumber: String,
      trainingCompleted: Boolean,
      serviceArea: String,
    },
    
    // For Parent
    parentDetails: {
      children: [{
        name: String,
        age: Number,
        gender: String,
        anganwadiCenter: String,
      }],
      occupation: String,
      familySize: Number,
    },
    
    // For Adolescent Girl
    adolescentDetails: {
      age: {
        type: Number,
        min: 10,
        max: 19,
      },
      schoolName: String,
      class: String,
      guardianName: String,
      guardianPhone: String,
    },
    
    // For Sanitation Worker
    sanitationDetails: {
      employeeId: String,
      assignedRoutes: [String],
      vehicleNumber: String,
      workingHours: String,
    },
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  isVerified: {
    type: Boolean,
    default: false,
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: null,
  },
  
  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'ml'],
    },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
  },
  
  // Authentication
  tempPassword: {
    type: String,
    default: null,
  },
  
  hashedPassword: {
    type: String,
    default: null,
  },
  
  // Password Reset
  resetPasswordToken: {
    type: String,
    default: null,
  },
  
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  
  // Metadata
  lastLogin: {
    type: Date,
    default: null,
  },
  
  loginCount: {
    type: Number,
    default: 0,
  },
  
  // Audit fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance (email and firebaseUid already have unique indexes)
userSchema.index({ role: 1 });
userSchema.index({ 'address.district': 1 });
userSchema.index({ 'address.block': 1 });
userSchema.index({ createdAt: -1 });

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  const addr = this.address;
  if (!addr) return '';
  
  const parts = [
    addr.street,
    addr.village,
    addr.block,
    addr.city,
    addr.district,
    addr.state,
    addr.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Virtual for role display name
userSchema.virtual('roleDisplayName').get(function() {
  const roleNames = {
    'super-admin': 'Super Admin (Panchayat Official)',
    'anganwadi-worker': 'Anganwadi Worker',
    'asha-volunteer': 'ASHA Worker/Volunteer',
    'parent': 'Parent/Guardian',
    'adolescent-girl': 'Adolescent Girl',
    'sanitation-worker': 'Sanitation Worker',
  };
  return roleNames[this.role] || this.role;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Update the updatedAt field
  this.updatedAt = new Date();
  
  // Validate role-specific data
  if (this.role === 'adolescent-girl' && this.roleSpecificData?.adolescentDetails?.age) {
    const age = this.roleSpecificData.adolescentDetails.age;
    if (age < 10 || age > 19) {
      return next(new Error('Adolescent age must be between 10 and 19 years'));
    }
  }
  
  next();
});

// Instance methods
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  this.loginCount += 1;
  return this.save();
};

userSchema.methods.toSafeObject = function() {
  const userObject = this.toObject();
  
  // Remove sensitive information
  delete userObject.firebaseUid;
  delete userObject.__v;
  
  return userObject;
};

// Static methods
userSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true });
};

userSchema.statics.findByDistrict = function(district) {
  return this.find({ 
    'address.district': district, 
    isActive: true 
  });
};

userSchema.statics.getActiveUsersCount = function() {
  return this.countDocuments({ isActive: true });
};

userSchema.statics.getRoleStats = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
};

// Create and export model
const User = mongoose.model('User', userSchema);

module.exports = User;