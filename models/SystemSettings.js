const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  general: {
    systemName: {
      type: String,
      default: 'SampoornaAangan'
    },
    panchayatName: {
      type: String,
      default: ''
    },
    district: {
      type: String,
      default: ''
    },
    state: {
      type: String,
      default: ''
    },
    logo: {
      type: String,
      default: null
    },
    primaryColor: {
      type: String,
      default: '#e91e63'
    },
    secondaryColor: {
      type: String,
      default: '#2196f3'
    }
  },
  
  roles: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      admin: { name: 'Admin', permissions: ['all'] },
      aww: { name: 'Anganwadi Worker', permissions: ['registration', 'attendance', 'nutrition', 'health'] },
      asha: { name: 'ASHA Worker', permissions: ['health', 'reports'] },
      parent: { name: 'Parent', permissions: ['view_child', 'attendance'] },
      adolescent: { name: 'Adolescent', permissions: ['health', 'nutrition'] }
    }
  },
  
  notifications: {
    emailEnabled: {
      type: Boolean,
      default: true
    },
    smsEnabled: {
      type: Boolean,
      default: false
    },
    emailConfig: {
      provider: {
        type: String,
        enum: ['gmail', 'outlook', 'custom'],
        default: 'gmail'
      },
      host: String,
      port: Number,
      username: String,
      password: String,
      secure: {
        type: Boolean,
        default: true
      }
    },
    smsConfig: {
      provider: {
        type: String,
        enum: ['twilio', 'aws', 'custom'],
        default: 'twilio'
      },
      apiKey: String,
      apiSecret: String,
      from: String
    },
    parentAlerts: {
      attendance: {
        type: Boolean,
        default: true
      },
      health: {
        type: Boolean,
        default: true
      },
      nutrition: {
        type: Boolean,
        default: false
      },
      vaccination: {
        type: Boolean,
        default: true
      }
    },
    workerAlerts: {
      lowAttendance: {
        type: Boolean,
        default: true
      },
      healthScreening: {
        type: Boolean,
        default: true
      },
      stockAlert: {
        type: Boolean,
        default: true
      },
      reports: {
        type: Boolean,
        default: false
      }
    }
  },
  
  health: {
    growthMonitoringInterval: {
      type: Number,
      default: 30 // days
    },
    vaccinationReminders: {
      type: Boolean,
      default: true
    },
    nutritionMenuRotation: {
      type: String,
      enum: ['weekly', 'monthly', 'seasonal'],
      default: 'weekly'
    },
    healthScreeningFrequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly'],
      default: 'monthly'
    },
    defaultVaccinations: [{
      name: String,
      ageInMonths: Number,
      description: String
    }],
    nutritionStandards: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  waste: {
    collectionSchedule: {
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'daily'
      },
      time: {
        type: String,
        default: '10:00'
      },
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]
    },
    sanitationWorkers: [{
      name: String,
      contact: String,
      area: String,
      active: {
        type: Boolean,
        default: true
      }
    }],
    alertThreshold: {
      type: Number,
      default: 24 // hours
    },
    wasteCategories: [{
      name: String,
      color: String,
      description: String
    }]
  },
  
  security: {
    sessionTimeout: {
      type: Number,
      default: 24 // hours
    },
    passwordExpiry: {
      type: Number,
      default: 90 // days
    },
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: false
      }
    },
    backupFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'weekly'
    },
    dataRetention: {
      type: Number,
      default: 365 // days
    },
    encryptionEnabled: {
      type: Boolean,
      default: true
    },
    twoFactorAuth: {
      type: Boolean,
      default: false
    }
  },
  
  reports: {
    autoGenerate: {
      type: Boolean,
      default: true
    },
    defaultFormat: {
      type: String,
      enum: ['pdf', 'excel', 'csv'],
      default: 'pdf'
    },
    scheduledReports: [{
      name: String,
      type: String,
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'yearly']
      },
      recipients: [String],
      active: {
        type: Boolean,
        default: true
      }
    }],
    dashboardMetrics: [{
      type: String,
      enum: ['attendance', 'nutrition', 'health', 'growth', 'waste', 'users']
    }],
    dataVisualization: {
      charts: {
        type: Boolean,
        default: true
      },
      graphs: {
        type: Boolean,
        default: true
      },
      animations: {
        type: Boolean,
        default: true
      }
    }
  },
  
  maintenance: {
    modules: {
      registration: {
        type: Boolean,
        default: true
      },
      attendance: {
        type: Boolean,
        default: true
      },
      nutrition: {
        type: Boolean,
        default: true
      },
      health: {
        type: Boolean,
        default: true
      },
      waste: {
        type: Boolean,
        default: true
      },
      reports: {
        type: Boolean,
        default: true
      }
    },
    version: {
      type: String,
      default: '1.0.0'
    },
    lastUpdate: {
      type: Date,
      default: Date.now
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    debugMode: {
      type: Boolean,
      default: false
    },
    cacheSettings: {
      enabled: {
        type: Boolean,
        default: true
      },
      duration: {
        type: Number,
        default: 3600 // seconds
      }
    }
  }
}, {
  timestamps: true,
  collection: 'systemsettings'
});

// Ensure only one settings document exists
systemSettingsSchema.statics.getSingleton = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = new this();
    await settings.save();
  }
  return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

module.exports = SystemSettings;