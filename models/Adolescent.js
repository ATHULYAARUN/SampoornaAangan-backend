const mongoose = require('mongoose');

const adolescentSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required'],
    validate: {
      validator: function(value) {
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        return age >= 10 && age <= 19;
      },
      message: 'Age must be between 10 and 19 years for adolescent registration'
    }
  },
  
  phone: {
    type: String,
    match: [/^(\+91\s?)?[0-9]{10}$/, 'Please enter a valid phone number'],
  },
  
  email: {
    type: String,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address',
    ],
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
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address',
    ],
  },
  
  relationToAdolescent: {
    type: String,
    required: [true, 'Relation to adolescent is required'],
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
  
  // Education Information
  education: {
    schoolName: {
      type: String,
      trim: true
    },
    grade: {
      type: String,
      trim: true
    },
    isInSchool: {
      type: Boolean,
      default: true
    },
    dropoutReason: {
      type: String,
      trim: true
    },
    educationLevel: {
      type: String,
      enum: ['primary', 'middle', 'secondary', 'higher-secondary', 'graduate', 'dropout'],
      default: 'middle'
    }
  },
  
  // Health Information
  height: {
    type: Number,
    min: [100, 'Height must be at least 100 cm'],
    max: [200, 'Height cannot exceed 200 cm']
  },
  
  weight: {
    type: Number,
    min: [20, 'Weight must be at least 20 kg'],
    max: [100, 'Weight cannot exceed 100 kg']
  },
  
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
  },
  
  // Menstrual Health (for girls)
  menstrualHealth: {
    hasMenstruationStarted: {
      type: Boolean,
      default: false
    },
    ageAtMenarche: {
      type: Number,
      min: [8, 'Age at menarche must be at least 8'],
      max: [18, 'Age at menarche cannot exceed 18']
    },
    menstrualCycleLength: {
      type: Number,
      min: [21, 'Menstrual cycle length must be at least 21 days'],
      max: [35, 'Menstrual cycle length cannot exceed 35 days']
    },
    lastMenstrualPeriod: Date,
    menstrualProblems: [String],
    hygieneEducationReceived: {
      type: Boolean,
      default: false
    }
  },
  
  // Medical History
  medicalHistory: {
    allergies: [String],
    chronicConditions: [String],
    disabilities: [String],
    medications: [String],
    previousSurgeries: [String]
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
    enum: ['normal', 'underweight', 'severely-underweight', 'overweight', 'obese'],
    default: 'normal'
  },
  
  // Health Checkups
  healthCheckups: [{
    date: {
      type: Date,
      required: true
    },
    height: Number,
    weight: Number,
    bmi: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    hemoglobin: Number,
    vision: {
      type: String,
      enum: ['normal', 'defective']
    },
    dental: {
      type: String,
      enum: ['normal', 'problems']
    },
    menstrualIssues: [String],
    counselingProvided: [String],
    referrals: [String],
    checkedBy: String,
    nextCheckup: Date
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
    enum: ['active', 'inactive', 'transferred', 'graduated'],
    default: 'active'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Programs and Services
  programsEnrolled: [{
    programName: {
      type: String,
      required: true
    },
    enrollmentDate: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active'
    }
  }],
  
  // Counseling and Support
  counselingSessions: [{
    date: {
      type: Date,
      required: true
    },
    topic: {
      type: String,
      required: true
    },
    counselor: String,
    notes: String,
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date
  }],
  
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
adolescentSchema.virtual('age').get(function() {
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

// Virtual for BMI calculation
adolescentSchema.virtual('bmi').get(function() {
  if (!this.height || !this.weight) return null;
  
  const heightInMeters = this.height / 100;
  return (this.weight / (heightInMeters * heightInMeters)).toFixed(1);
});

// Index for efficient queries
adolescentSchema.index({ anganwadiCenter: 1, status: 1 });
adolescentSchema.index({ parentPhone: 1 });
adolescentSchema.index({ registrationDate: -1 });
adolescentSchema.index({ 'education.isInSchool': 1 });

// Pre-save middleware
adolescentSchema.pre('save', function(next) {
  // Ensure name is properly formatted
  if (this.name) {
    this.name = this.name.replace(/\s+/g, ' ').trim();
  }
  
  if (this.parentName) {
    this.parentName = this.parentName.replace(/\s+/g, ' ').trim();
  }
  
  next();
});

const Adolescent = mongoose.model('Adolescent', adolescentSchema);

module.exports = Adolescent;
