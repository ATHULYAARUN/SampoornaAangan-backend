const mongoose = require('mongoose');

const pregnantWomanSchema = new mongoose.Schema({
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
        return age >= 15 && age <= 50;
      },
      message: 'Age must be between 15 and 50 years'
    }
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
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
  
  // Husband/Partner Information
  husbandName: {
    type: String,
    required: [true, 'Husband/Partner name is required'],
    trim: true,
    maxlength: [100, 'Husband name cannot exceed 100 characters'],
  },
  
  husbandPhone: {
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
  
  // Pregnancy Information
  lastMenstrualPeriod: {
    type: Date,
    required: [true, 'Last menstrual period date is required']
  },
  
  expectedDeliveryDate: {
    type: Date,
    required: [true, 'Expected delivery date is required']
  },
  
  pregnancyNumber: {
    type: Number,
    required: [true, 'Pregnancy number is required'],
    min: [1, 'Pregnancy number must be at least 1']
  },
  
  previousPregnancies: {
    liveBirths: {
      type: Number,
      default: 0,
      min: [0, 'Live births cannot be negative']
    },
    stillBirths: {
      type: Number,
      default: 0,
      min: [0, 'Still births cannot be negative']
    },
    miscarriages: {
      type: Number,
      default: 0,
      min: [0, 'Miscarriages cannot be negative']
    },
    abortions: {
      type: Number,
      default: 0,
      min: [0, 'Abortions cannot be negative']
    }
  },
  
  // Health Information
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
  },
  
  height: {
    type: Number,
    min: [120, 'Height must be at least 120 cm'],
    max: [200, 'Height cannot exceed 200 cm']
  },
  
  prePregnancyWeight: {
    type: Number,
    min: [30, 'Pre-pregnancy weight must be at least 30 kg'],
    max: [150, 'Pre-pregnancy weight cannot exceed 150 kg']
  },
  
  currentWeight: {
    type: Number,
    min: [30, 'Current weight must be at least 30 kg'],
    max: [150, 'Current weight cannot exceed 150 kg']
  },
  
  // Medical History
  medicalHistory: {
    diabetes: { type: Boolean, default: false },
    hypertension: { type: Boolean, default: false },
    heartDisease: { type: Boolean, default: false },
    kidneyDisease: { type: Boolean, default: false },
    thyroidDisorder: { type: Boolean, default: false },
    anemia: { type: Boolean, default: false },
    allergies: [String],
    medications: [String],
    previousComplications: [String]
  },
  
  // Antenatal Care
  antenatalCheckups: [{
    date: {
      type: Date,
      required: true
    },
    gestationalAge: {
      type: Number,
      required: true
    },
    weight: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    hemoglobin: Number,
    fundalHeight: Number,
    fetalHeartRate: Number,
    complications: [String],
    medications: [String],
    nextVisit: Date,
    checkedBy: String
  }],
  
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
    enum: ['active', 'delivered', 'transferred', 'inactive'],
    default: 'active'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Delivery Information (filled after delivery)
  deliveryDetails: {
    deliveryDate: Date,
    deliveryType: {
      type: String,
      enum: ['normal', 'cesarean', 'assisted']
    },
    deliveryPlace: {
      type: String,
      enum: ['hospital', 'home', 'anganwadi', 'other']
    },
    complications: [String],
    babyDetails: {
      gender: {
        type: String,
        enum: ['male', 'female']
      },
      weight: Number,
      length: Number,
      apgarScore: Number
    }
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
pregnantWomanSchema.virtual('age').get(function() {
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

// Virtual for gestational age calculation
pregnantWomanSchema.virtual('gestationalAge').get(function() {
  if (!this.lastMenstrualPeriod) return null;
  
  const today = new Date();
  const lmp = new Date(this.lastMenstrualPeriod);
  const diffTime = Math.abs(today - lmp);
  const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  return diffWeeks;
});

// Index for efficient queries
pregnantWomanSchema.index({ anganwadiCenter: 1, status: 1 });
pregnantWomanSchema.index({ phone: 1 });
pregnantWomanSchema.index({ expectedDeliveryDate: 1 });
pregnantWomanSchema.index({ registrationDate: -1 });

// Pre-save middleware
pregnantWomanSchema.pre('save', function(next) {
  // Ensure name is properly formatted
  if (this.name) {
    this.name = this.name.replace(/\s+/g, ' ').trim();
  }
  
  if (this.husbandName) {
    this.husbandName = this.husbandName.replace(/\s+/g, ' ').trim();
  }
  
  // Calculate expected delivery date if not provided
  if (this.lastMenstrualPeriod && !this.expectedDeliveryDate) {
    const lmp = new Date(this.lastMenstrualPeriod);
    const edd = new Date(lmp.getTime() + (280 * 24 * 60 * 60 * 1000)); // Add 280 days
    this.expectedDeliveryDate = edd;
  }
  
  next();
});

const PregnantWoman = mongoose.model('PregnantWoman', pregnantWomanSchema);

module.exports = PregnantWoman;
