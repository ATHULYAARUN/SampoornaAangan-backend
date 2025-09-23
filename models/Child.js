const mongoose = require('mongoose');

const childSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Child name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Date of birth cannot be in the future'
    }
  },
  
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female', 'other'],
      message: 'Gender must be male, female, or other'
    }
  },
  
  // Parent/Guardian Information
  parentName: {
    type: String,
    required: [true, 'Parent/Guardian name is required'],
    trim: true,
    maxlength: [100, 'Parent name cannot exceed 100 characters'],
  },
  
  parentPhone: {
    type: String,
    required: [true, 'Parent phone number is required'],
    match: [/^(\+91\s?)?[0-9]{10}$/, 'Please enter a valid phone number'],
  },
  
  parentEmail: {
    type: String,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(value) {
        // Only validate if email is provided
        if (!value || value === '') return true;
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value);
      },
      message: 'Please enter a valid email address'
    }
  },
  
  relationToChild: {
    type: String,
    required: [true, 'Relation to child is required'],
    enum: {
      values: ['mother', 'father', 'grandmother', 'grandfather', 'aunt', 'uncle', 'guardian', 'other'],
      message: 'Invalid relation type'
    }
  },
  
  // Address Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true
    },
    village: {
      type: String,
      required: [true, 'Village is required'],
      trim: true
    },
    block: {
      type: String,
      required: [true, 'Block is required'],
      trim: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode'],
    }
  },
  
  // Anganwadi Information
  anganwadiCenter: {
    type: String,
    required: [true, 'Anganwadi center is required'],
    trim: true
  },
  
  registeredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Registered by user is required']
  },
  
  // Health Information
  birthWeight: {
    type: Number,
    min: [0.5, 'Birth weight must be at least 0.5 kg'],
    max: [10, 'Birth weight cannot exceed 10 kg']
  },
  
  currentWeight: {
    type: Number,
    min: [0.5, 'Current weight must be at least 0.5 kg'],
    max: [50, 'Current weight cannot exceed 50 kg']
  },
  
  currentHeight: {
    type: Number,
    min: [30, 'Current height must be at least 30 cm'],
    max: [200, 'Current height cannot exceed 200 cm']
  },
  
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
  },
  
  // Medical History
  medicalHistory: {
    allergies: [String],
    chronicConditions: [String],
    disabilities: [String],
    medications: [String]
  },
  
  // Vaccination Records
  vaccinations: [{
    vaccineName: {
      type: String,
      required: true
    },
    dateGiven: {
      type: Date,
      required: true
    },
    nextDue: Date,
    batchNumber: String,
    givenBy: String
  }],
  
  // Nutrition Information
  nutritionStatus: {
    type: String,
    enum: ['normal', 'underweight', 'severely-underweight', 'overweight'],
    default: 'normal'
  },
  
  // Status and Tracking
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred', 'graduated'],
    default: 'active'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Additional Information
  specialNeeds: {
    type: String,
    trim: true
  },
  
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for age calculation
childSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for age in months (useful for infants)
childSchema.virtual('ageInMonths').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  const months = (today.getFullYear() - birthDate.getFullYear()) * 12 + 
                 (today.getMonth() - birthDate.getMonth());
  
  return months;
});

// Index for efficient queries
childSchema.index({ anganwadiCenter: 1, status: 1 });
childSchema.index({ parentPhone: 1 });
childSchema.index({ enrollmentDate: -1 });

// Pre-save middleware
childSchema.pre('save', function(next) {
  // Ensure name is properly formatted
  if (this.name) {
    this.name = this.name.replace(/\s+/g, ' ').trim();
  }
  
  if (this.parentName) {
    this.parentName = this.parentName.replace(/\s+/g, ' ').trim();
  }
  
  next();
});

const Child = mongoose.model('Child', childSchema);

module.exports = Child;
