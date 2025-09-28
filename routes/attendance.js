const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Child = require('../models/Child');
const { verifyFlexibleAuth } = require('../middleware/auth');

// Get today's attendance for an anganwadi center
router.get('/today/:anganwadiCenter', verifyFlexibleAuth, async (req, res) => {
  try {
    const { anganwadiCenter } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Get all children from this anganwadi center
    const children = await Child.find({ anganwadiCenter: anganwadiCenter })
      .select('name dateOfBirth gender parentName parentPhone')
      .sort({ name: 1 });

    // Get today's attendance records
    const attendanceRecords = await Attendance.find({
      anganwadiCenter: anganwadiCenter,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });

    // Create attendance map for quick lookup
    const attendanceMap = {};
    attendanceRecords.forEach(record => {
      attendanceMap[record.childId.toString()] = record;
    });

    // Combine children data with attendance status
    const attendanceData = children.map(child => {
      const attendanceRecord = attendanceMap[child._id.toString()];
      const age = Math.floor((today - new Date(child.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
      
      return {
        childId: child._id,
        name: child.name,
        age: `${age} years`,
        gender: child.gender,
        parentName: child.parentName,
        parentPhone: child.parentPhone,
        status: attendanceRecord ? attendanceRecord.status : 'absent',
        timeIn: attendanceRecord ? attendanceRecord.timeIn : null,
        timeOut: attendanceRecord ? attendanceRecord.timeOut : null,
        notes: attendanceRecord ? attendanceRecord.notes : '',
        nutritionReceived: attendanceRecord ? attendanceRecord.nutritionReceived : false,
        healthCheckDone: attendanceRecord ? attendanceRecord.healthCheckDone : false,
        attendanceId: attendanceRecord ? attendanceRecord._id : null
      };
    });

    // Calculate statistics
    const totalChildren = children.length;
    const presentCount = attendanceData.filter(child => 
      ['present', 'late'].includes(child.status)
    ).length;
    const absentCount = attendanceData.filter(child => child.status === 'absent').length;
    const lateCount = attendanceData.filter(child => child.status === 'late').length;
    const attendanceRate = totalChildren > 0 ? Math.round((presentCount / totalChildren) * 100) : 0;

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        anganwadiCenter,
        statistics: {
          total: totalChildren,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          attendanceRate: `${attendanceRate}%`
        },
        children: attendanceData
      }
    });

  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance data',
      error: error.message
    });
  }
});

// Test route without authentication for debugging
router.get('/test/:anganwadiCenter', async (req, res) => {
  try {
    const { anganwadiCenter } = req.params;
    console.log('🧪 Test route called for:', anganwadiCenter);
    
    const children = await Child.find({ anganwadiCenter: anganwadiCenter })
      .select('name dateOfBirth gender')
      .limit(5);
    
    res.json({
      success: true,
      message: 'Test route working',
      anganwadiCenter,
      childrenCount: children.length,
      children: children.map(child => ({
        name: child.name,
        age: Math.floor((new Date() - new Date(child.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
      }))
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      success: false,
      message: 'Test route failed',
      error: error.message
    });
  }
});

// Mark attendance for a child
router.post('/mark', verifyFlexibleAuth, async (req, res) => {
  try {
    const {
      childId,
      childName,
      anganwadiCenter,
      status,
      timeIn,
      timeOut,
      notes,
      nutritionReceived,
      healthCheckDone
    } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if attendance already exists for today
    const existingAttendance = await Attendance.findOne({
      childId: childId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.timeIn = timeIn || existingAttendance.timeIn;
      existingAttendance.timeOut = timeOut || existingAttendance.timeOut;
      existingAttendance.notes = notes || existingAttendance.notes;
      existingAttendance.nutritionReceived = nutritionReceived !== undefined ? nutritionReceived : existingAttendance.nutritionReceived;
      existingAttendance.healthCheckDone = healthCheckDone !== undefined ? healthCheckDone : existingAttendance.healthCheckDone;
      existingAttendance.markedBy = req.user.email || req.user.username;
      existingAttendance.markedAt = new Date();

      await existingAttendance.save();

      res.json({
        success: true,
        message: 'Attendance updated successfully',
        data: existingAttendance
      });
    } else {
      // Create new attendance record
      const newAttendance = new Attendance({
        childId,
        childName,
        anganwadiCenter,
        date: today,
        status,
        timeIn: timeIn || (status === 'present' || status === 'late' ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null),
        timeOut,
        notes: notes || '',
        markedBy: req.user.email || req.user.username,
        nutritionReceived: nutritionReceived || false,
        healthCheckDone: healthCheckDone || false
      });

      await newAttendance.save();

      res.json({
        success: true,
        message: 'Attendance marked successfully',
        data: newAttendance
      });
    }

  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
});

// Bulk mark attendance (mark all present/absent)
router.post('/bulk-mark', verifyFlexibleAuth, async (req, res) => {
  try {
    const { anganwadiCenter, status, childIds } = req.body;

    if (!['present', 'absent'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Use "present" or "absent".'
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    // Get children to mark attendance for
    let children;
    if (childIds && childIds.length > 0) {
      children = await Child.find({ 
        _id: { $in: childIds },
        anganwadiCenter: anganwadiCenter 
      }).select('name');
    } else {
      // Mark all children from the anganwadi center
      children = await Child.find({ anganwadiCenter: anganwadiCenter }).select('name');
    }

    const bulkOperations = [];

    for (const child of children) {
      bulkOperations.push({
        updateOne: {
          filter: {
            childId: child._id,
            date: {
              $gte: today,
              $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          },
          update: {
            $set: {
              childId: child._id,
              childName: child.name,
              anganwadiCenter,
              date: today,
              status,
              timeIn: status === 'present' ? currentTime : null,
              markedBy: req.user.email || req.user.username,
              markedAt: new Date()
            }
          },
          upsert: true
        }
      });
    }

    const result = await Attendance.bulkWrite(bulkOperations);

    res.json({
      success: true,
      message: `Bulk attendance marked as ${status} for ${children.length} children`,
      data: {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
        total: children.length
      }
    });

  } catch (error) {
    console.error('Error bulk marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk mark attendance',
      error: error.message
    });
  }
});

// Get attendance history for a child
router.get('/history/:childId', verifyFlexibleAuth, async (req, res) => {
  try {
    const { childId } = req.params;
    const { startDate, endDate, limit = 30 } = req.query;

    let query = { childId };

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const attendanceHistory = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .populate('childId', 'name');

    res.json({
      success: true,
      data: attendanceHistory
    });

  } catch (error) {
    console.error('Error fetching attendance history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance history',
      error: error.message
    });
  }
});

// Get attendance statistics for a date range
router.get('/statistics/:anganwadiCenter', verifyFlexibleAuth, async (req, res) => {
  try {
    const { anganwadiCenter } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // Default: last 30 days
    const end = endDate ? new Date(endDate) : new Date();

    // Get attendance summary
    const summary = await Attendance.getAttendanceSummary(anganwadiCenter, start, end);

    // Get daily attendance rates
    const dailyStats = await Attendance.aggregate([
      {
        $match: {
          anganwadiCenter: anganwadiCenter,
          date: { $gte: start, $lte: end }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } }
          },
          totalChildren: { $sum: 1 },
          presentChildren: {
            $sum: {
              $cond: [
                { $in: ["$status", ["present", "late"]] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          attendanceRate: {
            $round: [
              { $multiply: [{ $divide: ["$presentChildren", "$totalChildren"] }, 100] },
              2
            ]
          }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    res.json({
      success: true,
      data: {
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0]
        },
        summary,
        dailyStats
      }
    });

  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance statistics',
      error: error.message
    });
  }
});

// Delete attendance record (admin only)
router.delete('/:attendanceId', verifyFlexibleAuth, async (req, res) => {
  try {
    const { attendanceId } = req.params;

    // Check if user has admin privileges (you may want to add role-based auth here)
    const deletedAttendance = await Attendance.findByIdAndDelete(attendanceId);

    if (!deletedAttendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete attendance record',
      error: error.message
    });
  }
});

module.exports = router;