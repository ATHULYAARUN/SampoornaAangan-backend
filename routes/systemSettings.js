const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const AnganwadiCenter = require('../models/AnganwadiCenter');
const User = require('../models/User');
const { verifyAdminAuth: verifyAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Check file type
    if (file.fieldname === 'logo') {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files allowed for logo'), false);
      }
    } else {
      cb(null, true);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Get all system settings
router.get('/', verifyAdmin, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    
    // If no settings exist, create default settings
    if (!settings) {
      settings = new SystemSettings({
        general: {
          systemName: 'SampoornaAangan',
          panchayatName: '',
          district: '',
          state: '',
          logo: null,
          primaryColor: '#e91e63',
          secondaryColor: '#2196f3'
        },
        roles: {
          admin: { name: 'Admin', permissions: ['all'] },
          aww: { name: 'Anganwadi Worker', permissions: ['registration', 'attendance', 'nutrition', 'health'] },
          asha: { name: 'ASHA Worker', permissions: ['health', 'reports'] },
          parent: { name: 'Parent', permissions: ['view_child', 'attendance'] },
          adolescent: { name: 'Adolescent', permissions: ['health', 'nutrition'] }
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          parentAlerts: {
            attendance: true,
            health: true,
            nutrition: false,
            vaccination: true
          },
          workerAlerts: {
            lowAttendance: true,
            healthScreening: true,
            stockAlert: true,
            reports: false
          }
        },
        health: {
          growthMonitoringInterval: 30,
          vaccinationReminders: true,
          nutritionMenuRotation: 'weekly',
          healthScreeningFrequency: 'monthly'
        },
        waste: {
          collectionSchedule: {
            frequency: 'daily',
            time: '10:00'
          },
          sanitationWorkers: [],
          alertThreshold: 24
        },
        security: {
          sessionTimeout: 24,
          passwordExpiry: 90,
          backupFrequency: 'weekly',
          dataRetention: 365
        },
        reports: {
          autoGenerate: true,
          defaultFormat: 'pdf',
          scheduledReports: [],
          dashboardMetrics: ['attendance', 'nutrition', 'health', 'growth']
        },
        maintenance: {
          modules: {
            registration: true,
            attendance: true,
            nutrition: true,
            health: true,
            waste: true,
            reports: true
          },
          version: '1.0.0',
          lastUpdate: new Date()
        }
      });
      
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch system settings',
      error: error.message 
    });
  }
});

// Save all system settings
router.put('/', verifyAdmin, async (req, res) => {
  try {
    const settingsData = req.body;
    settingsData.maintenance.lastUpdate = new Date();
    
    let settings = await SystemSettings.findOne();
    
    if (settings) {
      // Update existing settings
      Object.keys(settingsData).forEach(key => {
        settings[key] = settingsData[key];
      });
      settings.markModified('general');
      settings.markModified('roles');
      settings.markModified('notifications');
      settings.markModified('health');
      settings.markModified('waste');
      settings.markModified('security');
      settings.markModified('reports');
      settings.markModified('maintenance');
    } else {
      // Create new settings
      settings = new SystemSettings(settingsData);
    }
    
    await settings.save();
    
    res.json({
      success: true,
      message: 'Settings saved successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error saving system settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save system settings',
      error: error.message 
    });
  }
});

// Get specific section settings
router.get('/:section', verifyAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    const settings = await SystemSettings.findOne();
    
    if (!settings || !settings[section]) {
      return res.status(404).json({
        success: false,
        message: 'Settings section not found'
      });
    }
    
    res.json({
      success: true,
      data: settings[section]
    });
  } catch (error) {
    console.error(`Error fetching ${req.params.section} settings:`, error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to fetch ${req.params.section} settings`,
      error: error.message 
    });
  }
});

// Update specific section settings
router.put('/:section', verifyAdmin, async (req, res) => {
  try {
    const { section } = req.params;
    const sectionData = req.body;
    
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }
    
    settings[section] = { ...settings[section], ...sectionData };
    settings.maintenance.lastUpdate = new Date();
    settings.markModified(section);
    settings.markModified('maintenance');
    
    await settings.save();
    
    res.json({
      success: true,
      message: `${section} settings updated successfully`,
      data: settings[section]
    });
  } catch (error) {
    console.error(`Error updating ${req.params.section} settings:`, error);
    res.status(500).json({ 
      success: false, 
      message: `Failed to update ${req.params.section} settings`,
      error: error.message 
    });
  }
});

// Upload logo
router.post('/upload-logo', verifyAdmin, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No logo file uploaded'
      });
    }
    
    const logoPath = `/uploads/${req.file.filename}`;
    
    // Update settings with new logo path
    let settings = await SystemSettings.findOne();
    if (settings) {
      settings.general.logo = logoPath;
      settings.markModified('general');
      await settings.save();
    }
    
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { logoPath }
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to upload logo',
      error: error.message 
    });
  }
});

// Get Anganwadi Centers
router.get('/centers', verifyAdmin, async (req, res) => {
  try {
    const centers = await AnganwadiCenter.find()
      .populate('assignedWorker', 'name email')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: centers
    });
  } catch (error) {
    console.error('Error fetching Anganwadi centers:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch centers',
      error: error.message 
    });
  }
});

// Create Anganwadi Center
router.post('/centers', verifyAdmin, async (req, res) => {
  try {
    const centerData = req.body;
    const center = new AnganwadiCenter(centerData);
    await center.save();
    
    await center.populate('assignedWorker', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Anganwadi center created successfully',
      data: center
    });
  } catch (error) {
    console.error('Error creating Anganwadi center:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create center',
      error: error.message 
    });
  }
});

// Update Anganwadi Center
router.put('/centers/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const center = await AnganwadiCenter.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('assignedWorker', 'name email');
    
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Anganwadi center not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Anganwadi center updated successfully',
      data: center
    });
  } catch (error) {
    console.error('Error updating Anganwadi center:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update center',
      error: error.message 
    });
  }
});

// Delete Anganwadi Center
router.delete('/centers/:id', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const center = await AnganwadiCenter.findByIdAndDelete(id);
    
    if (!center) {
      return res.status(404).json({
        success: false,
        message: 'Anganwadi center not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Anganwadi center deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Anganwadi center:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete center',
      error: error.message 
    });
  }
});

// Test notification
router.post('/test-notification', verifyAdmin, async (req, res) => {
  try {
    const { type, recipient } = req.body;
    
    // Here you would integrate with your email/SMS service
    // For now, we'll just simulate the test
    
    const testResults = {
      email: {
        success: true,
        message: `Test email sent to ${recipient}`
      },
      sms: {
        success: true,
        message: `Test SMS sent to ${recipient}`
      }
    };
    
    res.json({
      success: true,
      message: testResults[type].message,
      data: testResults[type]
    });
  } catch (error) {
    console.error('Error testing notification:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test notification',
      error: error.message 
    });
  }
});

// System maintenance endpoints
router.post('/maintenance/clear-cache', verifyAdmin, async (req, res) => {
  try {
    // Clear cache logic here
    // For now, just simulate cache clearing
    
    res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to clear cache',
      error: error.message 
    });
  }
});

router.put('/maintenance/modules/:moduleId', verifyAdmin, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { enabled } = req.body;
    
    let settings = await SystemSettings.findOne();
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Settings not found'
      });
    }
    
    settings.maintenance.modules[moduleId] = enabled;
    settings.markModified('maintenance');
    await settings.save();
    
    res.json({
      success: true,
      message: `Module ${moduleId} ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: settings.maintenance.modules
    });
  } catch (error) {
    console.error('Error toggling module:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle module',
      error: error.message 
    });
  }
});

// Get system information
router.get('/system-info', verifyAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const centerCount = await AnganwadiCenter.countDocuments();
    
    const systemInfo = {
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      userCount,
      centerCount,
      nodeVersion: process.version,
      platform: process.platform
    };
    
    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('Error fetching system info:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch system info',
      error: error.message 
    });
  }
});

// Export settings
router.get('/export', verifyAdmin, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'No settings found to export'
      });
    }
    
    const exportData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      settings: settings.toObject()
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=system-settings-${new Date().toISOString().split('T')[0]}.json`);
    res.json(exportData);
  } catch (error) {
    console.error('Error exporting settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to export settings',
      error: error.message 
    });
  }
});

// Import settings
router.post('/import', verifyAdmin, upload.single('settings'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No settings file uploaded'
      });
    }
    
    const fileContent = await fs.readFile(req.file.path, 'utf8');
    const importData = JSON.parse(fileContent);
    
    if (!importData.settings) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings file format'
      });
    }
    
    // Update settings
    let settings = await SystemSettings.findOne();
    if (settings) {
      Object.keys(importData.settings).forEach(key => {
        if (key !== '_id' && key !== '__v') {
          settings[key] = importData.settings[key];
        }
      });
      settings.markModified('general');
      settings.markModified('roles');
      settings.markModified('notifications');
      settings.markModified('health');
      settings.markModified('waste');
      settings.markModified('security');
      settings.markModified('reports');
      settings.markModified('maintenance');
    } else {
      delete importData.settings._id;
      delete importData.settings.__v;
      settings = new SystemSettings(importData.settings);
    }
    
    await settings.save();
    
    // Clean up uploaded file
    await fs.unlink(req.file.path);
    
    res.json({
      success: true,
      message: 'Settings imported successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error importing settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to import settings',
      error: error.message 
    });
  }
});

module.exports = router;