const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Child = require('../models/Child');
const Attendance = require('../models/Attendance');

// Test endpoint to simulate worker login and attendance access
router.post('/test-worker-attendance', async (req, res) => {
  try {
    const { workerEmail } = req.body;
    
    console.log(`🧪 Testing attendance access for: ${workerEmail}`);
    
    // Find the worker
    const worker = await User.findOne({ 
      email: workerEmail,
      role: 'anganwadi-worker'
    });
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    console.log(`✅ Worker found: ${worker.name}`);
    console.log(`🏢 Center: ${worker.roleSpecificData?.anganwadiCenter?.name}`);
    
    // Get worker's anganwadi center
    const workerCenter = worker.roleSpecificData?.anganwadiCenter?.name;
    if (!workerCenter) {
      return res.status(400).json({
        success: false,
        message: 'Worker is not assigned to any anganwadi center'
      });
    }
    
    // Get children from worker's anganwadi
    const children = await Child.find({ 
      anganwadiCenter: workerCenter,
      status: 'active'
    }).sort({ name: 1 });
    
    console.log(`👶 Found ${children.length} children in ${workerCenter}`);
    
    // Get today's attendance for these children
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysAttendance = await Attendance.find({
      anganwadiCenter: workerCenter,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    console.log(`📋 Found ${todaysAttendance.length} attendance records for today`);
    
    // Combine children data with attendance status
    const childrenWithAttendance = children.map(child => {
      const attendance = todaysAttendance.find(att => att.childId.toString() === child._id.toString());
      return {
        _id: child._id,
        name: child.name,
        age: child.age,
        gender: child.gender,
        parentName: child.parentName,
        parentPhone: child.parentPhone,
        attendanceStatus: attendance ? attendance.status : 'not-marked',
        attendanceMarked: !!attendance,
        timeIn: attendance?.timeIn || null,
        timeOut: attendance?.timeOut || null,
        nutritionReceived: attendance?.nutritionReceived || false,
        healthCheckDone: attendance?.healthCheckDone || false,
        notes: attendance?.notes || ''
      };
    });
    
    // Calculate statistics
    const stats = {
      total: children.length,
      present: childrenWithAttendance.filter(c => c.attendanceStatus === 'present').length,
      absent: childrenWithAttendance.filter(c => c.attendanceStatus === 'absent').length,
      late: childrenWithAttendance.filter(c => c.attendanceStatus === 'late').length,
      marked: todaysAttendance.length
    };
    
    res.json({
      success: true,
      message: 'Worker attendance data retrieved successfully',
      data: {
        worker: {
          name: worker.name,
          email: worker.email,
          anganwadiCenter: workerCenter
        },
        date: today.toISOString().split('T')[0],
        statistics: stats,
        children: childrenWithAttendance
      }
    });
    
  } catch (error) {
    console.error('Test worker attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test worker attendance',
      error: error.message
    });
  }
});

// Test endpoint to mark attendance
router.post('/test-mark-attendance', async (req, res) => {
  try {
    const { workerEmail, childId, status, timeIn, nutritionReceived, healthCheckDone, notes } = req.body;
    
    console.log(`🧪 Testing attendance marking by ${workerEmail} for child ${childId}`);
    
    // Find the worker
    const worker = await User.findOne({ 
      email: workerEmail,
      role: 'anganwadi-worker'
    });
    
    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }
    
    // Find the child
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }
    
    // Verify child belongs to worker's anganwadi
    const workerCenter = worker.roleSpecificData?.anganwadiCenter?.name;
    if (child.anganwadiCenter !== workerCenter) {
      return res.status(403).json({
        success: false,
        message: `Child ${child.name} does not belong to ${workerCenter}`
      });
    }
    
    console.log(`✅ Verification passed: ${child.name} belongs to ${workerCenter}`);
    
    // Check if attendance already marked for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await Attendance.findOne({
      childId: childId,
      date: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    let attendanceRecord;
    
    if (existingAttendance) {
      // Update existing attendance
      console.log(`📝 Updating existing attendance for ${child.name}`);
      existingAttendance.status = status;
      existingAttendance.timeIn = timeIn || existingAttendance.timeIn;
      existingAttendance.notes = notes || existingAttendance.notes;
      existingAttendance.nutritionReceived = nutritionReceived !== undefined ? nutritionReceived : existingAttendance.nutritionReceived;
      existingAttendance.healthCheckDone = healthCheckDone !== undefined ? healthCheckDone : existingAttendance.healthCheckDone;
      existingAttendance.markedBy = worker.email;
      existingAttendance.markedAt = new Date();

      attendanceRecord = await existingAttendance.save();
    } else {
      // Create new attendance record
      console.log(`➕ Creating new attendance record for ${child.name}`);
      const newAttendance = new Attendance({
        childId: childId,
        childName: child.name,
        anganwadiCenter: workerCenter,
        date: today,
        status: status,
        timeIn: timeIn || (status === 'present' || status === 'late' ? new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : null),
        notes: notes || '',
        markedBy: worker.email,
        nutritionReceived: nutritionReceived || false,
        healthCheckDone: healthCheckDone || false
      });

      attendanceRecord = await newAttendance.save();
    }
    
    console.log(`✅ Attendance marked successfully: ${child.name} - ${status}`);
    
    res.json({
      success: true,
      message: `Attendance marked as ${status} for ${child.name}`,
      data: {
        attendanceRecord,
        worker: {
          name: worker.name,
          email: worker.email,
          anganwadiCenter: workerCenter
        },
        child: {
          name: child.name,
          age: child.age
        }
      }
    });
    
  } catch (error) {
    console.error('Test mark attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark attendance',
      error: error.message
    });
  }
});

// Get all workers for testing
router.get('/test-workers', async (req, res) => {
  try {
    const workers = await User.find({ 
      role: 'anganwadi-worker',
      isActive: true 
    }).select('name email phone roleSpecificData');
    
    const workersWithCenters = workers.map(worker => ({
      name: worker.name,
      email: worker.email,
      phone: worker.phone,
      anganwadiCenter: worker.roleSpecificData?.anganwadiCenter?.name || 'Not assigned'
    }));
    
    res.json({
      success: true,
      data: workersWithCenters
    });
    
  } catch (error) {
    console.error('Get workers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get workers',
      error: error.message
    });
  }
});

module.exports = router;