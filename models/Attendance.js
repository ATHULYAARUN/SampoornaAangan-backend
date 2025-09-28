const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  childId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Child',
    required: true
  },
  childName: {
    type: String,
    required: true
  },
  anganwadiCenter: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'half-day', 'sick'],
    required: true,
    default: 'absent'
  },
  timeIn: {
    type: String, // Format: "HH:MM"
    default: null
  },
  timeOut: {
    type: String, // Format: "HH:MM"
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  markedBy: {
    type: String, // AWW username/email
    required: true
  },
  markedAt: {
    type: Date,
    default: Date.now
  },
  nutritionReceived: {
    type: Boolean,
    default: false
  },
  healthCheckDone: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
attendanceSchema.index({ childId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ anganwadiCenter: 1, date: 1 });
attendanceSchema.index({ date: 1, status: 1 });

// Virtual for formatted date
attendanceSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-IN');
});

// Method to get attendance summary for a date range
attendanceSchema.statics.getAttendanceSummary = async function(anganwadiCenter, startDate, endDate) {
  const summary = await this.aggregate([
    {
      $match: {
        anganwadiCenter: anganwadiCenter,
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  return summary;
};

// Method to get daily attendance rate
attendanceSchema.statics.getDailyAttendanceRate = async function(anganwadiCenter, date) {
  const attendanceData = await this.aggregate([
    {
      $match: {
        anganwadiCenter: anganwadiCenter,
        date: {
          $gte: new Date(date.setHours(0, 0, 0, 0)),
          $lt: new Date(date.setHours(23, 59, 59, 999))
        }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const total = attendanceData.reduce((sum, item) => sum + item.count, 0);
  const present = attendanceData.find(item => item._id === 'present')?.count || 0;
  const late = attendanceData.find(item => item._id === 'late')?.count || 0;

  return {
    total,
    present: present + late, // Count late as present for attendance rate
    absent: attendanceData.find(item => item._id === 'absent')?.count || 0,
    rate: total > 0 ? Math.round(((present + late) / total) * 100) : 0
  };
};

module.exports = mongoose.model('Attendance', attendanceSchema);