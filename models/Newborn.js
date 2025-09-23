const mongoose = require('mongoose');

const newbornSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value) {
        const today = new Date();
        const diffTime = Math.abs(today - value);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 42; // Within 6 weeks
      },
      message: 'Newborn registration is only for babies within 6 weeks of birth'
    }
  },
  
  timeOfBirth: {
    type: String,
    required: [true, 'Time of birth is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter time in HH:MM format']
  },
  
  gender: {
    type: String,
    required: [true, 'Gender is required'],
    enum: {
      values: ['male', 'female'],
      message: 'Gender must be male or female'
    }
  },
  
  // Mother Information
  motherName: {
    type: String,
    required: [true, 'Mother name is required'],
    trim: true,
    maxlength: [100, 'Mother name cannot exceed 100 characters'],
  },
  
  motherAge: {
    type: Number,
    required: [true, 'Mother age is required'],
    min: [15, 'Mother age must be at least 15'],
    max: [50, 'Mother age cannot exceed 50']
  },
  
  motherPhone: {
    type: String,
    required: [true, 'Mother phone number is required'],
    match: [/^(\+91\s?)?[0-9]{10}$/, 'Please enter a valid phone number'],
  },
  
  motherEmail: {
    type: String,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address',
    ],
  },
  
  // Father Information
  fatherName: {
    type: String,
    required: [true, 'Father name is required'],
    trim: true,
    maxlength: [100, 'Father name cannot exceed 100 characters'],
  },
  
  fatherAge: {
    type: Number,
    min: [18, 'Father age must be at least 18'],
    max: [70, 'Father age cannot exceed 70']
  },
  
  fatherPhone: {
    type: String,
    match: [/^(\+91\s?)?[0-9]{10}$/, 'Please enter a valid phone number'],
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
  
  // Birth Information
  birthDetails: {
    placeOfBirth: {
      type: String,
      required: [true, 'Place of birth is required'],
      enum: {
        values: ['hospital', 'home', 'anganwadi', 'other'],
        message: 'Invalid place of birth'
      }
    },
    
    deliveryType: {
      type: String,
      required: [true, 'Delivery type is required'],
      enum: {
        values: ['normal', 'cesarean', 'assisted'],
        message: 'Invalid delivery type'
      }
    },
    
    attendedBy: {
      type: String,
      required: [true, 'Birth attendant information is required'],
      enum: {
        values: ['doctor', 'nurse', 'midwife', 'anm', 'asha', 'family', 'other'],
        message: 'Invalid birth attendant type'
      }
    },
    
    complications: [String],
    
    gestationalAge: {
      type: Number,
      required: [true, 'Gestational age is required'],
      min: [24, 'Gestational age must be at least 24 weeks'],
      max: [44, 'Gestational age cannot exceed 44 weeks']
    }
  },
  
  // Physical Measurements
  measurements: {
    birthWeight: {
      type: Number,
      required: [true, 'Birth weight is required'],
      min: [0.5, 'Birth weight must be at least 0.5 kg'],
      max: [6, 'Birth weight cannot exceed 6 kg']
    },
    
    birthLength: {
      type: Number,
      required: [true, 'Birth length is required'],
      min: [30, 'Birth length must be at least 30 cm'],
      max: [60, 'Birth length cannot exceed 60 cm']
    },
    
    headCircumference: {
      type: Number,
      min: [25, 'Head circumference must be at least 25 cm'],
      max: [40, 'Head circumference cannot exceed 40 cm']
    },
    
    chestCircumference: {
      type: Number,
      min: [25, 'Chest circumference must be at least 25 cm'],
      max: [40, 'Chest circumference cannot exceed 40 cm']
    }
  },
  
  // Health Assessment
  healthAssessment: {
    apgarScore: {
      oneMinute: {
        type: Number,
        min: [0, 'APGAR score must be between 0 and 10'],
        max: [10, 'APGAR score must be between 0 and 10']
      },
      fiveMinute: {
        type: Number,
        min: [0, 'APGAR score must be between 0 and 10'],
        max: [10, 'APGAR score must be between 0 and 10']
      }
    },
    
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
    },
    
    congenitalAnomalies: [String],
    
    birthDefects: [String],
    
    respiratoryDistress: {
      type: Boolean,
      default: false
    },
    
    feedingDifficulties: {
      type: Boolean,
      default: false
    },
    
    jaundice: {
      type: Boolean,
      default: false
    }
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
    givenBy: String,
    site: String
  }],
  
  // Feeding Information
  feedingDetails: {
    breastfeedingInitiated: {
      type: Boolean,
      default: false
    },
    
    timeToFirstFeed: {
      type: Number, // in hours
      min: [0, 'Time to first feed cannot be negative']
    },
    
    feedingType: {
      type: String,
      enum: ['exclusive-breastfeeding', 'mixed-feeding', 'formula-feeding'],
      default: 'exclusive-breastfeeding'
    },
    
    feedingProblems: [String]
  },
  
  // Follow-up Care
  followUpVisits: [{
    date: {
      type: Date,
      required: true
    },
    ageInDays: {
      type: Number,
      required: true
    },
    weight: Number,
    length: Number,
    headCircumference: Number,
    feedingStatus: String,
    healthIssues: [String],
    vaccinesGiven: [String],
    nextVisit: Date,
    visitedBy: String
  }],
  
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
  
  // Status and Tracking
  registrationDate: {
    type: Date,
    default: Date.now
  },
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'transferred', 'deceased'],
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

// Virtual for age in days
newbornSchema.virtual('ageInDays').get(function() {
  if (!this.dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  const diffTime = Math.abs(today - birthDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
});

// Virtual for weight category
newbornSchema.virtual('weightCategory').get(function() {
  if (!this.measurements?.birthWeight) return null;
  
  const weight = this.measurements.birthWeight;
  if (weight < 1.5) return 'extremely-low';
  if (weight < 2.5) return 'low';
  if (weight >= 2.5 && weight <= 4.0) return 'normal';
  return 'high';
});

// Index for efficient queries
newbornSchema.index({ anganwadiCenter: 1, status: 1 });
newbornSchema.index({ motherPhone: 1 });
newbornSchema.index({ dateOfBirth: -1 });
newbornSchema.index({ registrationDate: -1 });

// Pre-save middleware
newbornSchema.pre('save', function(next) {
  // Ensure names are properly formatted
  if (this.name) {
    this.name = this.name.replace(/\s+/g, ' ').trim();
  }
  
  if (this.motherName) {
    this.motherName = this.motherName.replace(/\s+/g, ' ').trim();
  }
  
  if (this.fatherName) {
    this.fatherName = this.fatherName.replace(/\s+/g, ' ').trim();
  }
  
  next();
});

const Newborn = mongoose.model('Newborn', newbornSchema);

module.exports = Newborn;
