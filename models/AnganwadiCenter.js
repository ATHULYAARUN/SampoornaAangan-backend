const mongoose = require('mongoose');

const anganwadiCenterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  ward: {
    number: {
      type: Number,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    }
  },
  address: {
    street: String,
    locality: String,
    pincode: String,
    district: String,
    state: String
  },
  contact: {
    phone: String,
    email: String
  },
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  capacity: {
    children: {
      type: Number,
      default: 50
    },
    adolescents: {
      type: Number,
      default: 25
    },
    pregnantWomen: {
      type: Number,
      default: 15
    }
  },
  facilities: [{
    type: String,
    enum: [
      'kitchen',
      'playground',
      'toilet',
      'water_supply',
      'electricity',
      'medical_kit',
      'weighing_scale',
      'height_chart',
      'storage_room'
    ]
  }],
  location: {
    latitude: Number,
    longitude: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'closed'],
    default: 'active'
  },
  establishedDate: {
    type: Date,
    default: Date.now
  },
  lastInspection: {
    date: Date,
    inspector: String,
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    notes: String
  },
  operatingHours: {
    start: {
      type: String,
      default: '09:00'
    },
    end: {
      type: String,
      default: '16:00'
    },
    workingDays: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }]
  },
  services: [{
    type: String,
    enum: [
      'supplementary_nutrition',
      'immunization',
      'health_checkup',
      'pre_school_education',
      'nutrition_health_education',
      'adolescent_programs'
    ]
  }],
  statistics: {
    totalBeneficiaries: {
      type: Number,
      default: 0
    },
    activeChildren: {
      type: Number,
      default: 0
    },
    activeAdolescents: {
      type: Number,
      default: 0
    },
    pregnantWomen: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  collection: 'anganwadicenters'
});

// Indexes
anganwadiCenterSchema.index({ code: 1 });
anganwadiCenterSchema.index({ 'ward.number': 1 });
anganwadiCenterSchema.index({ status: 1 });
anganwadiCenterSchema.index({ assignedWorker: 1 });

// Virtual for full address
anganwadiCenterSchema.virtual('fullAddress').get(function() {
  const address = this.address;
  if (!address) return '';
  
  const parts = [
    address.street,
    address.locality,
    address.district,
    address.state,
    address.pincode
  ].filter(Boolean);
  
  return parts.join(', ');
});

// Method to check if center is operational
anganwadiCenterSchema.methods.isOperational = function() {
  return this.status === 'active' && this.assignedWorker;
};

// Method to get occupancy rate
anganwadiCenterSchema.methods.getOccupancyRate = function() {
  const totalCapacity = this.capacity.children + this.capacity.adolescents + this.capacity.pregnantWomen;
  const totalOccupied = this.statistics.activeChildren + this.statistics.activeAdolescents + this.statistics.pregnantWomen;
  
  return totalCapacity > 0 ? (totalOccupied / totalCapacity) * 100 : 0;
};

// Static method to find centers by ward
anganwadiCenterSchema.statics.findByWard = function(wardNumber) {
  return this.find({ 'ward.number': wardNumber, status: 'active' });
};

// Static method to find centers needing worker assignment
anganwadiCenterSchema.statics.findUnassigned = function() {
  return this.find({ 
    assignedWorker: null, 
    status: 'active' 
  });
};

// Pre-save middleware to generate center code if not provided
anganwadiCenterSchema.pre('save', function(next) {
  if (!this.code && this.isNew) {
    // Generate code: AWC + Ward + Sequential number
    const wardPart = this.ward.number.toString().padStart(2, '0');
    this.code = `AWC${wardPart}${Date.now().toString().slice(-4)}`;
  }
  next();
});

// Post-save middleware to update statistics
anganwadiCenterSchema.post('save', async function(doc) {
  // Here you could trigger updates to related statistics
  // For example, update district-level statistics
});

const AnganwadiCenter = mongoose.model('AnganwadiCenter', anganwadiCenterSchema);

module.exports = AnganwadiCenter;