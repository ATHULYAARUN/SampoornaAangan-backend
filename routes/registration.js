const express = require('express');
const router = express.Router();

// Import models
const Child = require('../models/Child');
const PregnantWoman = require('../models/PregnantWoman');
const Adolescent = require('../models/Adolescent');
const Newborn = require('../models/Newborn');

// Import middleware
const { verifyFirebaseAuth, verifyFlexibleAuth } = require('../middleware/auth');

// @desc    Register a new child
// @route   POST /api/registration/child
// @access  Private (Anganwadi Worker, ASHA Volunteer)
const registerChild = async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      gender,
      parentName,
      parentPhone,
      parentEmail,
      relationToChild,
      address,
      anganwadiCenter,
      birthWeight,
      currentWeight,
      currentHeight,
      bloodGroup,
      medicalHistory,
      specialNeeds,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !dateOfBirth || !gender || !parentName || !parentPhone || !relationToChild || !anganwadiCenter) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate age (must be between 3-6 years for Anganwadi)
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const ageInYears = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
    
    if (ageInYears < 3) {
      return res.status(400).json({
        success: false,
        message: 'Child must be at least 3 years old for Anganwadi registration'
      });
    }
    
    if (ageInYears > 6) {
      return res.status(400).json({
        success: false,
        message: 'Child must be 6 years old or younger for Anganwadi registration'
      });
    }

    // Check if child already exists (same name, parent phone, and DOB)
    const existingChild = await Child.findOne({
      name: name.trim(),
      parentPhone: parentPhone.trim(),
      dateOfBirth: new Date(dateOfBirth)
    });

    if (existingChild) {
      return res.status(400).json({
        success: false,
        message: 'Child with same details already registered'
      });
    }

    // Create new child record
    const childData = {
      name: name.trim(),
      dateOfBirth: new Date(dateOfBirth),
      gender,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail?.trim() || undefined,
      relationToChild,
      address,
      anganwadiCenter: anganwadiCenter.trim(),
      registeredBy: req.user._id,
      birthWeight,
      currentWeight,
      currentHeight,
      bloodGroup,
      medicalHistory,
      specialNeeds: specialNeeds?.trim(),
      notes: notes?.trim()
    };

    console.log('Creating child with data:', JSON.stringify(childData, null, 2));

    const child = new Child(childData);
    await child.save();

    res.status(201).json({
      success: true,
      message: 'Child registered successfully',
      data: {
        child: {
          id: child._id,
          name: child.name,
          age: child.age,
          parentName: child.parentName,
          anganwadiCenter: child.anganwadiCenter,
          registrationDate: child.enrollmentDate
        }
      }
    });

  } catch (error) {
    console.error('Child registration error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
        details: error.errors
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Child with similar details already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to register child',
      error: error.message
    });
  }
};

// @desc    Register a pregnant woman
// @route   POST /api/registration/pregnant-woman
// @access  Private (Anganwadi Worker, ASHA Volunteer)
const registerPregnantWoman = async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      phone,
      email,
      husbandName,
      husbandPhone,
      address,
      lastMenstrualPeriod,
      expectedDeliveryDate,
      pregnancyNumber,
      previousPregnancies,
      bloodGroup,
      height,
      prePregnancyWeight,
      currentWeight,
      medicalHistory,
      anganwadiCenter,
      specialNeeds,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !dateOfBirth || !phone || !husbandName || !lastMenstrualPeriod || !pregnancyNumber || !anganwadiCenter) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if pregnant woman already exists
    const existingWoman = await PregnantWoman.findOne({
      name: name.trim(),
      phone: phone.trim(),
      status: 'active'
    });

    if (existingWoman) {
      return res.status(400).json({
        success: false,
        message: 'Pregnant woman with same details already registered'
      });
    }

    // Create new pregnant woman record
    const womanData = {
      name: name.trim(),
      dateOfBirth: new Date(dateOfBirth),
      phone: phone.trim(),
      email: email?.trim(),
      husbandName: husbandName.trim(),
      husbandPhone: husbandPhone?.trim(),
      address,
      lastMenstrualPeriod: new Date(lastMenstrualPeriod),
      expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : undefined,
      pregnancyNumber,
      previousPregnancies,
      bloodGroup,
      height,
      prePregnancyWeight,
      currentWeight,
      medicalHistory,
      anganwadiCenter: anganwadiCenter.trim(),
      registeredBy: req.user._id,
      specialNeeds: specialNeeds?.trim(),
      notes: notes?.trim()
    };

    const pregnantWoman = new PregnantWoman(womanData);
    await pregnantWoman.save();

    res.status(201).json({
      success: true,
      message: 'Pregnant woman registered successfully',
      data: {
        pregnantWoman: {
          id: pregnantWoman._id,
          name: pregnantWoman.name,
          age: pregnantWoman.age,
          gestationalAge: pregnantWoman.gestationalAge,
          expectedDeliveryDate: pregnantWoman.expectedDeliveryDate,
          anganwadiCenter: pregnantWoman.anganwadiCenter,
          registrationDate: pregnantWoman.registrationDate
        }
      }
    });

  } catch (error) {
    console.error('Pregnant woman registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to register pregnant woman',
      error: error.message
    });
  }
};

// @desc    Register an adolescent
// @route   POST /api/registration/adolescent
// @access  Private (Anganwadi Worker, ASHA Volunteer)
const registerAdolescent = async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      phone,
      email,
      parentName,
      parentPhone,
      parentEmail,
      relationToAdolescent,
      address,
      education,
      height,
      weight,
      bloodGroup,
      menstrualHealth,
      medicalHistory,
      nutritionStatus,
      anganwadiCenter,
      specialNeeds,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !dateOfBirth || !parentName || !parentPhone || !relationToAdolescent || !anganwadiCenter) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if adolescent already exists
    const existingAdolescent = await Adolescent.findOne({
      name: name.trim(),
      parentPhone: parentPhone.trim(),
      dateOfBirth: new Date(dateOfBirth)
    });

    if (existingAdolescent) {
      return res.status(400).json({
        success: false,
        message: 'Adolescent with same details already registered'
      });
    }

    // Create new adolescent record
    const adolescentData = {
      name: name.trim(),
      dateOfBirth: new Date(dateOfBirth),
      phone: phone?.trim(),
      email: email?.trim(),
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail?.trim(),
      relationToAdolescent,
      address,
      education,
      height,
      weight,
      bloodGroup,
      menstrualHealth,
      medicalHistory,
      nutritionStatus,
      anganwadiCenter: anganwadiCenter.trim(),
      registeredBy: req.user._id,
      specialNeeds: specialNeeds?.trim(),
      notes: notes?.trim()
    };

    const adolescent = new Adolescent(adolescentData);
    await adolescent.save();

    res.status(201).json({
      success: true,
      message: 'Adolescent registered successfully',
      data: {
        adolescent: {
          id: adolescent._id,
          name: adolescent.name,
          age: adolescent.age,
          parentName: adolescent.parentName,
          education: adolescent.education,
          anganwadiCenter: adolescent.anganwadiCenter,
          registrationDate: adolescent.registrationDate
        }
      }
    });

  } catch (error) {
    console.error('Adolescent registration error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to register adolescent',
      error: error.message
    });
  }
};

// @desc    Register a newborn
// @route   POST /api/registration/newborn
// @access  Private (Anganwadi Worker, ASHA Volunteer)
const registerNewborn = async (req, res) => {
  try {
    const {
      name,
      dateOfBirth,
      timeOfBirth,
      gender,
      motherName,
      motherAge,
      motherPhone,
      motherEmail,
      fatherName,
      fatherAge,
      fatherPhone,
      address,
      birthDetails,
      measurements,
      healthAssessment,
      feedingDetails,
      anganwadiCenter,
      specialNeeds,
      notes
    } = req.body;

    // Validate required fields
    if (!dateOfBirth || !timeOfBirth || !gender || !motherName || !motherAge || !motherPhone || !fatherName || !anganwadiCenter) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if newborn already exists
    const existingNewborn = await Newborn.findOne({
      motherPhone: motherPhone.trim(),
      dateOfBirth: new Date(dateOfBirth),
      timeOfBirth: timeOfBirth.trim()
    });

    if (existingNewborn) {
      return res.status(400).json({
        success: false,
        message: 'Newborn with same details already registered'
      });
    }

    // Create new newborn record
    const newbornData = {
      name: name?.trim(),
      dateOfBirth: new Date(dateOfBirth),
      timeOfBirth: timeOfBirth.trim(),
      gender,
      motherName: motherName.trim(),
      motherAge,
      motherPhone: motherPhone.trim(),
      motherEmail: motherEmail?.trim(),
      fatherName: fatherName.trim(),
      fatherAge,
      fatherPhone: fatherPhone?.trim(),
      address,
      birthDetails,
      measurements,
      healthAssessment,
      feedingDetails,
      anganwadiCenter: anganwadiCenter.trim(),
      registeredBy: req.user._id,
      specialNeeds: specialNeeds?.trim(),
      notes: notes?.trim()
    };

    const newborn = new Newborn(newbornData);
    await newborn.save();

    res.status(201).json({
      success: true,
      message: 'Newborn registered successfully',
      data: {
        newborn: {
          id: newborn._id,
          name: newborn.name,
          ageInDays: newborn.ageInDays,
          motherName: newborn.motherName,
          weightCategory: newborn.weightCategory,
          anganwadiCenter: newborn.anganwadiCenter,
          registrationDate: newborn.registrationDate
        }
      }
    });

  } catch (error) {
    console.error('Newborn registration error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to register newborn',
      error: error.message
    });
  }
};

// @desc    Get all children for an anganwadi center
// @route   GET /api/registration/children
// @access  Private
const getChildren = async (req, res) => {
  try {
    const { anganwadiCenter, status = 'active', page = 1, limit = 10 } = req.query;

    const query = {};
    if (anganwadiCenter) query.anganwadiCenter = anganwadiCenter;
    if (status) query.status = status;

    const children = await Child.find(query)
      .sort({ enrollmentDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('registeredBy', 'name email');

    const total = await Child.countDocuments(query);

    res.json({
      success: true,
      data: {
        children,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch children',
      error: error.message
    });
  }
};

// @desc    Get all pregnant women for an anganwadi center
// @route   GET /api/registration/pregnant-women
// @access  Private
const getPregnantWomen = async (req, res) => {
  try {
    const { anganwadiCenter, status = 'active', page = 1, limit = 10 } = req.query;

    const query = {};
    if (anganwadiCenter) query.anganwadiCenter = anganwadiCenter;
    if (status) query.status = status;

    const pregnantWomen = await PregnantWoman.find(query)
      .sort({ registrationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('registeredBy', 'name email');

    const total = await PregnantWoman.countDocuments(query);

    res.json({
      success: true,
      data: {
        pregnantWomen,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get pregnant women error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pregnant women',
      error: error.message
    });
  }
};

// Routes
router.post('/child', verifyFirebaseAuth, registerChild);
router.post('/pregnant-woman', verifyFirebaseAuth, registerPregnantWoman);
router.post('/adolescent', verifyFirebaseAuth, registerAdolescent);
router.post('/newborn', verifyFirebaseAuth, registerNewborn);

// @desc    Get all adolescents for an anganwadi center
// @route   GET /api/registration/adolescents
// @access  Private
const getAdolescents = async (req, res) => {
  try {
    const { anganwadiCenter, status = 'active', page = 1, limit = 10 } = req.query;

    const query = {};
    if (anganwadiCenter) query.anganwadiCenter = anganwadiCenter;
    if (status) query.status = status;

    const adolescents = await Adolescent.find(query)
      .sort({ registrationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('registeredBy', 'name email');

    const total = await Adolescent.countDocuments(query);

    res.json({
      success: true,
      data: {
        adolescents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get adolescents error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch adolescents',
      error: error.message
    });
  }
};

// @desc    Get all newborns for an anganwadi center
// @route   GET /api/registration/newborns
// @access  Private
const getNewborns = async (req, res) => {
  try {
    const { anganwadiCenter, status = 'active', page = 1, limit = 10 } = req.query;

    const query = {};
    if (anganwadiCenter) query.anganwadiCenter = anganwadiCenter;
    if (status) query.status = status;

    const newborns = await Newborn.find(query)
      .sort({ registrationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('registeredBy', 'name email');

    const total = await Newborn.countDocuments(query);

    res.json({
      success: true,
      data: {
        newborns,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get newborns error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch newborns',
      error: error.message
    });
  }
};

// @desc    Get children for a specific parent
// @route   GET /api/registration/my-children
// @access  Private (Parent only)
const getMyChildren = async (req, res) => {
  try {
    const user = req.user;

    // Ensure user is a parent
    if (user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only parents can access this endpoint.'
      });
    }

    console.log('🔍 Fetching children for parent:', user.name, user.email, user.phone);

    // Find children based on parent phone or email
    const query = {
      $or: [
        { parentPhone: user.phone },
        { parentEmail: user.email }
      ],
      status: 'active'
    };

    // If user has phone, add it to query
    if (user.phone) {
      query.$or.push({ parentPhone: user.phone });
    }

    // If user has email, add it to query
    if (user.email) {
      query.$or.push({ parentEmail: user.email });
    }

    console.log('📋 Query for children:', JSON.stringify(query, null, 2));

    const children = await Child.find(query)
      .sort({ enrollmentDate: -1 })
      .populate('registeredBy', 'name email');

    console.log(`✅ Found ${children.length} children for parent ${user.name}`);

    // Calculate additional stats for each child
    const childrenWithStats = children.map(child => {
      const childObj = child.toObject();

      // Calculate age in years and months
      const today = new Date();
      const birthDate = new Date(child.dateOfBirth);
      const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 +
                         (today.getMonth() - birthDate.getMonth());

      return {
        ...childObj,
        ageInMonths,
        ageDisplay: child.age > 0 ? `${child.age} years` : `${ageInMonths} months`,
        lastUpdated: child.updatedAt,
        // Calculate vaccination status
        vaccinationStatus: child.vaccinations?.length > 0 ? 'up-to-date' : 'pending',
        // Calculate next checkup (example logic)
        nextCheckup: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        // Health status based on nutrition and growth
        healthStatus: child.nutritionStatus === 'normal' ? 'healthy' : 'needs-attention'
      };
    });

    res.json({
      success: true,
      data: {
        children: childrenWithStats,
        totalChildren: children.length,
        parent: {
          name: user.name,
          email: user.email,
          phone: user.phone
        }
      }
    });

  } catch (error) {
    console.error('Get my children error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch children',
      error: error.message
    });
  }
};

// @desc    Get detailed information for a specific child
// @route   GET /api/registration/my-children/:childId
// @access  Private (Parent only)
const getMyChildDetails = async (req, res) => {
  try {
    const user = req.user;
    const { childId } = req.params;

    // Ensure user is a parent
    if (user.role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only parents can access this endpoint.'
      });
    }

    // Find the child and verify parent relationship
    const child = await Child.findOne({
      _id: childId,
      $or: [
        { parentPhone: user.phone },
        { parentEmail: user.email }
      ],
      status: 'active'
    }).populate('registeredBy', 'name email');

    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or you do not have access to this child.'
      });
    }

    // Add additional calculated fields
    const childDetails = child.toObject();
    const today = new Date();
    const birthDate = new Date(child.dateOfBirth);
    const ageInMonths = (today.getFullYear() - birthDate.getFullYear()) * 12 +
                       (today.getMonth() - birthDate.getMonth());

    const detailedChild = {
      ...childDetails,
      ageInMonths,
      ageDisplay: child.age > 0 ? `${child.age} years` : `${ageInMonths} months`,
      // Growth percentiles (mock data - would be calculated based on WHO standards)
      growthPercentiles: {
        weight: child.currentWeight ? '75th percentile' : 'Not recorded',
        height: child.currentHeight ? '80th percentile' : 'Not recorded'
      },
      // Recent activities (mock data - would come from attendance/activity logs)
      recentActivities: [
        { date: new Date(), activity: 'Health checkup completed', type: 'health' },
        { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), activity: 'Attended nutrition program', type: 'nutrition' },
        { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), activity: 'Vaccination received', type: 'vaccination' }
      ],
      // Upcoming events
      upcomingEvents: [
        { date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), event: 'Health checkup due', type: 'health' },
        { date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), event: 'Next vaccination due', type: 'vaccination' }
      ]
    };

    res.json({
      success: true,
      data: {
        child: detailedChild
      }
    });

  } catch (error) {
    console.error('Get child details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child details',
      error: error.message
    });
  }
};

// Get routes
router.get('/children', verifyFirebaseAuth, getChildren);
router.get('/pregnant-women', verifyFirebaseAuth, getPregnantWomen);
router.get('/adolescents', verifyFirebaseAuth, getAdolescents);
router.get('/newborns', verifyFirebaseAuth, getNewborns);

// @desc    Export children data
// @route   GET /api/registration/children/export
// @access  Private
const exportChildren = async (req, res) => {
  try {
    const { format = 'json', anganwadiCenter, status = 'active', startDate, endDate } = req.query;

    // Build query
    const query = {};
    if (anganwadiCenter) query.anganwadiCenter = anganwadiCenter;
    if (status) query.status = status;

    // Add date range filter
    if (startDate || endDate) {
      query.enrollmentDate = {};
      if (startDate) query.enrollmentDate.$gte = new Date(startDate);
      if (endDate) query.enrollmentDate.$lte = new Date(endDate);
    }

    // Get children data
    const children = await Child.find(query)
      .select('-__v')
      .sort({ enrollmentDate: -1 })
      .populate('registeredBy', 'name email');

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertChildrenToCSV(children);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=children_export.csv');
      res.send(csv);
    } else {
      // Return JSON format
      res.json({
        success: true,
        data: {
          children,
          exportedAt: new Date().toISOString(),
          filters: { anganwadiCenter, status, startDate, endDate },
          totalRecords: children.length
        },
      });
    }
  } catch (error) {
    console.error('Export children error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed',
      error: error.message
    });
  }
};

// @desc    Export pregnant women data
// @route   GET /api/registration/pregnant-women/export
// @access  Private
const exportPregnantWomen = async (req, res) => {
  try {
    const { format = 'json', anganwadiCenter, status = 'active', startDate, endDate } = req.query;

    // Build query
    const query = {};
    if (anganwadiCenter) query.anganwadiCenter = anganwadiCenter;
    if (status) query.status = status;

    // Add date range filter
    if (startDate || endDate) {
      query.registrationDate = {};
      if (startDate) query.registrationDate.$gte = new Date(startDate);
      if (endDate) query.registrationDate.$lte = new Date(endDate);
    }

    // Get pregnant women data
    const pregnantWomen = await PregnantWoman.find(query)
      .select('-__v')
      .sort({ registrationDate: -1 })
      .populate('registeredBy', 'name email');

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertPregnantWomenToCSV(pregnantWomen);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=pregnant_women_export.csv');
      res.send(csv);
    } else {
      // Return JSON format
      res.json({
        success: true,
        data: {
          pregnantWomen,
          exportedAt: new Date().toISOString(),
          filters: { anganwadiCenter, status, startDate, endDate },
          totalRecords: pregnantWomen.length
        },
      });
    }
  } catch (error) {
    console.error('Export pregnant women error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed',
      error: error.message
    });
  }
};

// @desc    Export adolescents data
// @route   GET /api/registration/adolescents/export
// @access  Private
const exportAdolescents = async (req, res) => {
  try {
    const { format = 'json', anganwadiCenter, status = 'active', startDate, endDate } = req.query;

    // Build query
    const query = {};
    if (anganwadiCenter) query.anganwadiCenter = anganwadiCenter;
    if (status) query.status = status;

    // Add date range filter
    if (startDate || endDate) {
      query.registrationDate = {};
      if (startDate) query.registrationDate.$gte = new Date(startDate);
      if (endDate) query.registrationDate.$lte = new Date(endDate);
    }

    // Get adolescents data
    const adolescents = await Adolescent.find(query)
      .select('-__v')
      .sort({ registrationDate: -1 })
      .populate('registeredBy', 'name email');

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertAdolescentsToCSV(adolescents);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=adolescents_export.csv');
      res.send(csv);
    } else {
      // Return JSON format
      res.json({
        success: true,
        data: {
          adolescents,
          exportedAt: new Date().toISOString(),
          filters: { anganwadiCenter, status, startDate, endDate },
          totalRecords: adolescents.length
        },
      });
    }
  } catch (error) {
    console.error('Export adolescents error:', error);
    res.status(500).json({
      success: false,
      message: 'Export failed',
      error: error.message
    });
  }
};

// Helper functions for CSV conversion
const convertChildrenToCSV = (children) => {
  if (!children.length) return '';

  const headers = [
    'Name', 'Date of Birth', 'Age', 'Gender', 'Parent Name', 'Parent Phone',
    'Parent Email', 'Relation', 'Address', 'Anganwadi Center', 'Current Weight',
    'Current Height', 'Blood Group', 'Nutrition Status', 'Status', 'Enrollment Date'
  ];
  const csvRows = [headers.join(',')];

  children.forEach(child => {
    const address = `${child.address?.street || ''} ${child.address?.village || ''} ${child.address?.district || ''}`.trim();
    const row = [
      child.name || '',
      child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString() : '',
      child.age || '',
      child.gender || '',
      child.parentName || '',
      child.parentPhone || '',
      child.parentEmail || '',
      child.relationToChild || '',
      address,
      child.anganwadiCenter || '',
      child.currentWeight || '',
      child.currentHeight || '',
      child.bloodGroup || '',
      child.nutritionStatus || '',
      child.status || '',
      child.enrollmentDate ? new Date(child.enrollmentDate).toLocaleDateString() : ''
    ];
    // Escape commas in values
    const escapedRow = row.map(value => {
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csvRows.push(escapedRow.join(','));
  });

  return csvRows.join('\n');
};

const convertPregnantWomenToCSV = (pregnantWomen) => {
  if (!pregnantWomen.length) return '';

  const headers = [
    'Name', 'Age', 'Phone', 'Email', 'Husband Name', 'LMP', 'EDD',
    'Trimester', 'Address', 'Anganwadi Center', 'Risk Level', 'Status', 'Registration Date'
  ];
  const csvRows = [headers.join(',')];

  pregnantWomen.forEach(woman => {
    const address = `${woman.address?.street || ''} ${woman.address?.village || ''} ${woman.address?.district || ''}`.trim();
    const row = [
      woman.name || '',
      woman.age || '',
      woman.phone || '',
      woman.email || '',
      woman.husbandName || '',
      woman.lmp ? new Date(woman.lmp).toLocaleDateString() : '',
      woman.edd ? new Date(woman.edd).toLocaleDateString() : '',
      woman.trimester || '',
      address,
      woman.anganwadiCenter || '',
      woman.riskLevel || '',
      woman.status || '',
      woman.registrationDate ? new Date(woman.registrationDate).toLocaleDateString() : ''
    ];
    // Escape commas in values
    const escapedRow = row.map(value => {
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csvRows.push(escapedRow.join(','));
  });

  return csvRows.join('\n');
};

const convertAdolescentsToCSV = (adolescents) => {
  if (!adolescents.length) return '';

  const headers = [
    'Name', 'Age', 'Phone', 'Email', 'Guardian Name', 'Guardian Phone',
    'School Name', 'Class', 'Address', 'Anganwadi Center', 'Status', 'Registration Date'
  ];
  const csvRows = [headers.join(',')];

  adolescents.forEach(adolescent => {
    const address = `${adolescent.address?.street || ''} ${adolescent.address?.village || ''} ${adolescent.address?.district || ''}`.trim();
    const row = [
      adolescent.name || '',
      adolescent.age || '',
      adolescent.phone || '',
      adolescent.email || '',
      adolescent.guardianName || '',
      adolescent.guardianPhone || '',
      adolescent.schoolName || '',
      adolescent.class || '',
      address,
      adolescent.anganwadiCenter || '',
      adolescent.status || '',
      adolescent.registrationDate ? new Date(adolescent.registrationDate).toLocaleDateString() : ''
    ];
    // Escape commas in values
    const escapedRow = row.map(value => {
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    });
    csvRows.push(escapedRow.join(','));
  });

  return csvRows.join('\n');
};

// Parent-specific routes
router.get('/my-children', verifyFlexibleAuth, getMyChildren);
router.get('/my-children/:childId', verifyFlexibleAuth, getMyChildDetails);

// Export routes (support both Firebase and JWT tokens for admin access)
router.get('/children/export', verifyFlexibleAuth, exportChildren);
router.get('/pregnant-women/export', verifyFlexibleAuth, exportPregnantWomen);
router.get('/adolescents/export', verifyFlexibleAuth, exportAdolescents);

module.exports = router;
