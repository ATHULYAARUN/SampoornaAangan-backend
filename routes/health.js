const express = require('express');
const router = express.Router();
const Child = require('../models/Child');
const { verifyFlexibleAuth } = require('../middleware/auth');

// Get children health data for an Anganwadi center
router.get('/children', verifyFlexibleAuth, async (req, res) => {
  try {
    const { anganwadiCenter } = req.query;
    
    console.log('🏥 Fetching health data for center:', anganwadiCenter);
    
    if (!anganwadiCenter) {
      return res.status(400).json({
        success: false,
        message: 'Anganwadi center is required'
      });
    }

    // Find all active children in the specified center
    const children = await Child.find({
      anganwadiCenter: anganwadiCenter,
      status: 'active'
    }).select(
      'name dateOfBirth gender currentWeight currentHeight bloodGroup ' +
      'nutritionStatus vaccinations medicalHistory specialNeeds updatedAt ' +
      'parentName parentPhone'
    ).sort({ name: 1 });

    console.log(`📊 Found ${children.length} children for health monitoring`);

    res.json({
      success: true,
      data: {
        children,
        total: children.length,
        center: anganwadiCenter
      }
    });

  } catch (error) {
    console.error('❌ Error fetching health data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health data',
      error: error.message
    });
  }
});

// Update child health metrics
router.put('/children/:childId', verifyFlexibleAuth, async (req, res) => {
  try {
    const { childId } = req.params;
    const healthData = req.body;
    
    console.log('📝 Updating health data for child:', childId, healthData);

    // Validation
    if (healthData.currentWeight && (healthData.currentWeight < 0.5 || healthData.currentWeight > 50)) {
      return res.status(400).json({
        success: false,
        message: 'Weight must be between 0.5kg and 50kg'
      });
    }

    if (healthData.currentHeight && (healthData.currentHeight < 30 || healthData.currentHeight > 200)) {
      return res.status(400).json({
        success: false,
        message: 'Height must be between 30cm and 200cm'
      });
    }

    // Update child health data
    const updatedChild = await Child.findByIdAndUpdate(
      childId,
      {
        $set: {
          ...(healthData.currentWeight && { currentWeight: healthData.currentWeight }),
          ...(healthData.currentHeight && { currentHeight: healthData.currentHeight }),
          ...(healthData.nutritionStatus && { nutritionStatus: healthData.nutritionStatus }),
          ...(healthData.bloodGroup && { bloodGroup: healthData.bloodGroup }),
          ...(healthData.specialNeeds !== undefined && { specialNeeds: healthData.specialNeeds }),
          ...(healthData.medicalHistory && { medicalHistory: healthData.medicalHistory })
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedChild) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    console.log('✅ Health data updated successfully');

    res.json({
      success: true,
      data: updatedChild,
      message: 'Health data updated successfully'
    });

  } catch (error) {
    console.error('❌ Error updating health data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update health data',
      error: error.message
    });
  }
});

// Get vaccination schedule
router.get('/vaccinations', verifyFlexibleAuth, async (req, res) => {
  try {
    const { anganwadiCenter } = req.query;
    
    console.log('💉 Fetching vaccination schedule for center:', anganwadiCenter);
    
    if (!anganwadiCenter) {
      return res.status(400).json({
        success: false,
        message: 'Anganwadi center is required'
      });
    }

    // Find all active children in the specified center
    const children = await Child.find({
      anganwadiCenter: anganwadiCenter,
      status: 'active'
    }).select(
      'name dateOfBirth vaccinations'
    ).sort({ name: 1 });

    console.log(`💉 Found ${children.length} children for vaccination tracking`);

    res.json({
      success: true,
      data: {
        children,
        total: children.length,
        center: anganwadiCenter
      }
    });

  } catch (error) {
    console.error('❌ Error fetching vaccination schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vaccination schedule',
      error: error.message
    });
  }
});

// Record vaccination
router.post('/children/:childId/vaccinations', verifyFlexibleAuth, async (req, res) => {
  try {
    const { childId } = req.params;
    const vaccinationData = req.body;
    
    console.log('💉 Recording vaccination for child:', childId, vaccinationData);

    // Validation
    if (!vaccinationData.vaccineName || !vaccinationData.dateGiven) {
      return res.status(400).json({
        success: false,
        message: 'Vaccine name and date given are required'
      });
    }

    // Add vaccination record
    const updatedChild = await Child.findByIdAndUpdate(
      childId,
      {
        $push: {
          vaccinations: {
            vaccineName: vaccinationData.vaccineName,
            dateGiven: new Date(vaccinationData.dateGiven),
            nextDue: vaccinationData.nextDue ? new Date(vaccinationData.nextDue) : undefined,
            batchNumber: vaccinationData.batchNumber,
            givenBy: vaccinationData.givenBy || req.user.name || 'Health Worker'
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedChild) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }

    console.log('✅ Vaccination recorded successfully');

    res.json({
      success: true,
      data: updatedChild,
      message: 'Vaccination recorded successfully'
    });

  } catch (error) {
    console.error('❌ Error recording vaccination:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record vaccination',
      error: error.message
    });
  }
});

// Get health statistics for dashboard
router.get('/statistics', verifyFlexibleAuth, async (req, res) => {
  try {
    const { anganwadiCenter } = req.query;
    
    console.log('📊 Fetching health statistics for center:', anganwadiCenter);
    
    if (!anganwadiCenter) {
      return res.status(400).json({
        success: false,
        message: 'Anganwadi center is required'
      });
    }

    const children = await Child.find({
      anganwadiCenter: anganwadiCenter,
      status: 'active'
    });

    // Calculate statistics
    const totalChildren = children.length;
    const nutritionStats = {
      normal: children.filter(c => c.nutritionStatus === 'normal').length,
      underweight: children.filter(c => c.nutritionStatus === 'underweight').length,
      severelyUnderweight: children.filter(c => c.nutritionStatus === 'severely-underweight').length,
      overweight: children.filter(c => c.nutritionStatus === 'overweight').length
    };

    const healthChecksDue = children.filter(child => {
      const lastCheck = child.updatedAt;
      const monthsSinceCheck = (Date.now() - lastCheck) / (1000 * 60 * 60 * 24 * 30);
      return monthsSinceCheck > 1; // Due if more than 1 month since last update
    }).length;

    const vaccinationsDue = children.reduce((count, child) => {
      const ageInMonths = Math.floor((Date.now() - child.dateOfBirth) / (1000 * 60 * 60 * 24 * 30));
      const expectedVaccinations = Math.min(Math.floor(ageInMonths / 2) + 2, 10); // Simplified calculation
      const givenVaccinations = child.vaccinations ? child.vaccinations.length : 0;
      return count + Math.max(0, expectedVaccinations - givenVaccinations);
    }, 0);

    res.json({
      success: true,
      data: {
        totalChildren,
        nutritionStats,
        healthChecksDue,
        vaccinationsDue,
        center: anganwadiCenter
      }
    });

  } catch (error) {
    console.error('❌ Error fetching health statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health statistics',
      error: error.message
    });
  }
});

module.exports = router;