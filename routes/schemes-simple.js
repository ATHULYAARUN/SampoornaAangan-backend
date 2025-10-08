const express = require('express');
const router = express.Router();

// In-memory storage for enrollments (in production, this would be in MongoDB)
let enrollments = [];

// GET /api/schemes - Get all welfare schemes
router.get('/', async (req, res) => {
  try {
    console.log('📋 Getting welfare schemes...');
    
    // For now, return sample data
    const sampleSchemes = [
      // Boys' Schemes
      {
        _id: '1',
        name: 'Balak Vikas Yojana',
        description: 'Comprehensive development scheme for male children focusing on nutrition, health, and early education support in Anganwadi centers.',
        category: 'development',
        benefits: { amount: 1500, frequency: 'monthly', description: 'Monthly nutrition allowance, free health checkups, educational materials' },
        eligibility: { minAge: 3, maxAge: 6, gender: 'male', income: 'below_poverty_line' },
        documents: ['Birth Certificate', 'Income Certificate', 'Anganwadi Registration', 'Aadhaar Card'],
        isActive: true
      },
      {
        _id: '2',
        name: 'Swasth Balak Scheme',
        description: 'Health and nutrition focused scheme providing medical support, vaccination tracking, and growth monitoring for boys.',
        category: 'health',
        benefits: { amount: 2000, frequency: 'monthly', description: 'Free medical checkups, vaccination, nutritional supplements, growth monitoring' },
        eligibility: { minAge: 3, maxAge: 6, gender: 'male', income: 'all' },
        documents: ['Birth Certificate', 'Medical Records', 'Anganwadi Registration'],
        isActive: true
      },
      {
        _id: '3',
        name: 'Shiksha Prarambh (Boys)',
        description: 'Early education support scheme for boys providing learning materials, pre-school education, and skill development activities.',
        category: 'education',
        benefits: { amount: 1200, frequency: 'monthly', description: 'Educational toys, books, pre-school training, skill development activities' },
        eligibility: { minAge: 4, maxAge: 6, gender: 'male', income: 'all' },
        documents: ['Birth Certificate', 'Anganwadi Registration', 'Parent ID Proof'],
        isActive: true
      },
      
      // Girls' Schemes
      {
        _id: '4',
        name: 'Balika Samriddhi Yojana',
        description: 'Comprehensive development scheme for female children with focus on nutrition, health, and empowerment through Anganwadi programs.',
        category: 'development',
        benefits: { amount: 1800, frequency: 'monthly', description: 'Monthly nutrition allowance, free health checkups, educational materials, girl child bonus' },
        eligibility: { minAge: 3, maxAge: 6, gender: 'female', income: 'below_poverty_line' },
        documents: ['Birth Certificate', 'Income Certificate', 'Anganwadi Registration', 'Aadhaar Card'],
        isActive: true
      },
      {
        _id: '5',
        name: 'Swasth Balika Scheme',
        description: 'Specialized health scheme for girls providing enhanced medical care, nutrition support, and development tracking.',
        category: 'health',
        benefits: { amount: 2200, frequency: 'monthly', description: 'Free medical checkups, vaccination, nutritional supplements, girl-specific health monitoring' },
        eligibility: { minAge: 3, maxAge: 6, gender: 'female', income: 'all' },
        documents: ['Birth Certificate', 'Medical Records', 'Anganwadi Registration'],
        isActive: true
      },
      {
        _id: '6',
        name: 'Shiksha Prarambh (Girls)',
        description: 'Enhanced early education support for girls with additional focus on empowerment and leadership development activities.',
        category: 'education',
        benefits: { amount: 1400, frequency: 'monthly', description: 'Educational toys, books, pre-school training, leadership activities, girl empowerment programs' },
        eligibility: { minAge: 4, maxAge: 6, gender: 'female', income: 'all' },
        documents: ['Birth Certificate', 'Anganwadi Registration', 'Parent ID Proof'],
        isActive: true
      },
      
      // Universal Schemes (Both)
      {
        _id: '7',
        name: 'Anganwadi Nutrition Scheme',
        description: 'Universal nutrition support scheme for all children enrolled in Anganwadi providing daily meals and take-home rations.',
        category: 'nutrition',
        benefits: { amount: 1000, frequency: 'monthly', description: 'Daily hot cooked meals, take-home rations, nutrition counseling' },
        eligibility: { minAge: 3, maxAge: 6, gender: 'both', income: 'all' },
        documents: ['Birth Certificate', 'Anganwadi Registration'],
        isActive: true
      },
      {
        _id: '8',
        name: 'Immunization Plus',
        description: 'Comprehensive immunization and preventive healthcare scheme for all Anganwadi children with tracking and follow-up support.',
        category: 'health',
        benefits: { amount: 800, frequency: 'monthly', description: 'Complete immunization, health screening, preventive care, medical tracking' },
        eligibility: { minAge: 3, maxAge: 6, gender: 'both', income: 'all' },
        documents: ['Birth Certificate', 'Immunization Card', 'Anganwadi Registration'],
        isActive: true
      },
      {
        _id: '9',
        name: 'Early Childhood Development',
        description: 'Holistic development scheme covering cognitive, physical, and social development through structured Anganwadi activities.',
        category: 'development',
        benefits: { amount: 1600, frequency: 'monthly', description: 'Cognitive activities, physical development programs, social skills training, parent counseling' },
        eligibility: { minAge: 3, maxAge: 6, gender: 'both', income: 'all' },
        documents: ['Birth Certificate', 'Anganwadi Registration', 'Development Assessment'],
        isActive: true
      },
      {
        _id: '10',
        name: 'Digital Learning Initiative',
        description: 'Technology-enhanced learning program introducing basic digital literacy and interactive learning for modern education preparation.',
        category: 'education',
        benefits: { amount: 900, frequency: 'monthly', description: 'Digital learning tablets, educational apps, tech literacy programs, online safety training' },
        eligibility: { minAge: 5, maxAge: 6, gender: 'both', income: 'all' },
        documents: ['Birth Certificate', 'Anganwadi Registration', 'Parent Consent Form'],
        isActive: true
      }
    ];
    
    res.status(200).json({
      success: true,
      data: {
        schemes: sampleSchemes,
        total: sampleSchemes.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting schemes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get welfare schemes',
      error: error.message
    });
  }
});

// GET /api/schemes/enrollments - Get user enrollments
router.get('/enrollments', async (req, res) => {
  try {
    console.log('📊 Getting user enrollments...');
    console.log('📝 Current enrollments:', enrollments.length);
    
    // Return all enrollments (in production, filter by user ID)
    res.status(200).json({
      success: true,
      data: {
        enrollments: enrollments,
        total: enrollments.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get enrollments',
      error: error.message
    });
  }
});

// POST /api/schemes/enroll - Enroll in a scheme
router.post('/enroll', async (req, res) => {
  try {
    console.log('📝 Enrolling in scheme:', req.body);
    
    const { childId, schemeId, parentName, childName } = req.body;
    
    if (!childId || !schemeId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID and Scheme ID are required'
      });
    }
    
    // Check if already enrolled
    const existingEnrollment = enrollments.find(e => e.childId === childId && e.schemeId === schemeId);
    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'Already enrolled in this scheme'
      });
    }
    
    // Create enrollment record
    const enrollment = {
      _id: Date.now().toString(),
      childId,
      schemeId,
      parentName: parentName || 'Parent',
      childName: childName || 'Child',
      applicationNumber: `APP${Date.now()}${Math.floor(Math.random() * 1000)}`,
      status: 'pending', // Set as pending instead of submitted
      enrolledAt: new Date().toISOString(),
      userId: req.user?.uid || 'mock-user',
      approvedAt: null,
      benefits: {
        startDate: null,
        lastPayout: null,
        totalReceived: 0
      }
    };
    
    // Store enrollment
    enrollments.push(enrollment);
    console.log('✅ Enrollment created:', enrollment.applicationNumber);
    console.log('📊 Total enrollments:', enrollments.length);
    
    res.status(201).json({
      success: true,
      message: 'Successfully enrolled in scheme',
      data: { enrollment }
    });
    
  } catch (error) {
    console.error('❌ Error enrolling in scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in scheme',
      error: error.message
    });
  }
});

// GET /api/schemes/enrollments/:childId - Get enrollments for specific child
router.get('/enrollments/:childId', async (req, res) => {
  try {
    const { childId } = req.params;
    console.log('👶 Getting enrollments for child:', childId);
    
    const childEnrollments = enrollments.filter(e => e.childId === childId);
    
    res.status(200).json({
      success: true,
      data: {
        enrollments: childEnrollments,
        total: childEnrollments.length
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting child enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get child enrollments',
      error: error.message
    });
  }
});

module.exports = router;