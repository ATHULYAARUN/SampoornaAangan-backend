const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema({
  schemeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  keyBenefits: [{
    type: String,
    required: true
  }],
  eligibility: {
    gender: {
      type: String,
      enum: ['both', 'boys', 'girls'],
      default: 'both'
    },
    ageRange: {
      min: { type: Number, default: 3 },
      max: { type: Number, default: 6 }
    }
  },
  category: {
    type: String,
    enum: ['nutrition', 'education', 'health', 'financial', 'development'],
    required: true
  },
  implementingAgency: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const enrollmentSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  schemeId: {
    type: String,
    required: true
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  enrollmentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['enrolled', 'pending', 'approved', 'rejected'],
    default: 'enrolled'
  },
  applicationNumber: {
    type: String,
    unique: true
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Generate application number before saving
enrollmentSchema.pre('save', function(next) {
  if (!this.applicationNumber) {
    this.applicationNumber = `APP${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

const Scheme = mongoose.model('Scheme', schemeSchema);
const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = { Scheme, Enrollment };