const express = require('express');
const router = express.Router();
const { Scheme, Enrollment } = require('../models/Scheme');
const Child = require('../models/Child');
const authMiddleware = require('../middleware/authMiddleware');

// Initialize default schemes if they don't exist
const initializeSchemes = async () => {
  try {
    const existingSchemes = await Scheme.countDocuments();
    if (existingSchemes === 0) {
      const defaultSchemes = [
        // Common Benefits (Both Boys & Girls)
        {
          schemeId: 'ICDS_SNP',
          name: 'Free Meals & Snacks (ICDS)',
          description: 'Supplementary Nutrition Program providing free nutritious meals and snacks to children',
          keyBenefits: [
            'Daily hot cooked meals',
            'Nutritious snacks (morning & evening)',
            'Take-home rations for malnourished children',
            'Micronutrient supplements'
          ],
          eligibility: { gender: 'both', ageRange: { min: 3, max: 6 } },
          category: 'nutrition',
          implementingAgency: 'ICDS - Ministry of Women and Child Development'
        },
        {
          schemeId: 'ICDS_PSE',
          name: 'Pre-School Education',
          description: 'Early childhood care and education program at Anganwadi centers',
          keyBenefits: [
            'Play-based learning activities',
            'Language and cognitive development',
            'School readiness preparation',
            'Social and emotional development'
          ],
          eligibility: { gender: 'both', ageRange: { min: 3, max: 6 } },
          category: 'education',
          implementingAgency: 'ICDS - Ministry of Women and Child Development'
        },
        {
          schemeId: 'ICDS_HEALTH',
          name: 'Health Checkups & Growth Monitoring',
          description: 'Regular health checkups and growth monitoring services',
          keyBenefits: [
            'Monthly height and weight measurements',
            'Health status assessment',
            'Referral services for medical care',
            'Growth chart maintenance'
          ],
          eligibility: { gender: 'both', ageRange: { min: 3, max: 6 } },
          category: 'health',
          implementingAgency: 'ICDS - Ministry of Women and Child Development'
        },
        {
          schemeId: 'IMMUNIZATION',
          name: 'Immunizations & Vaccination Support',
          description: 'Complete immunization coverage for children',
          keyBenefits: [
            'Age-appropriate vaccinations',
            'Immunization record maintenance',
            'Vaccine-preventable disease protection',
            'Health worker counseling'
          ],
          eligibility: { gender: 'both', ageRange: { min: 3, max: 6 } },
          category: 'health',
          implementingAgency: 'Ministry of Health and Family Welfare'
        },
        {
          schemeId: 'MICRONUTRIENT',
          name: 'Micronutrient Supplements',
          description: 'Iron, Vitamin A, and deworming supplements for children',
          keyBenefits: [
            'Iron and folic acid supplements',
            'Vitamin A supplementation',
            'Deworming tablets',
            'Anemia prevention support'
          ],
          eligibility: { gender: 'both', ageRange: { min: 3, max: 6 } },
          category: 'health',
          implementingAgency: 'Ministry of Health and Family Welfare'
        },
        
        // Additional for Boys
        {
          schemeId: 'BAL_SHAKTI',
          name: 'Bal Shakti Nutrition Support',
          description: 'Special nutrition support program for boys',
          keyBenefits: [
            'Enhanced protein supplements',
            'Growth monitoring support',
            'Physical development activities',
            'Nutritional counseling for families'
          ],
          eligibility: { gender: 'boys', ageRange: { min: 3, max: 6 } },
          category: 'nutrition',
          implementingAgency: 'ICDS - Ministry of Women and Child Development'
        },
        {
          schemeId: 'SCHOOL_READINESS_BOYS',
          name: 'School Readiness Program (Boys)',
          description: 'Transition support program for boys entering primary school',
          keyBenefits: [
            'Pre-primary education activities',
            'Learning material support',
            'Parent counseling sessions',
            'School enrollment assistance'
          ],
          eligibility: { gender: 'boys', ageRange: { min: 5, max: 6 } },
          category: 'education',
          implementingAgency: 'Ministry of Education'
        },
        
        // Additional for Girls
        {
          schemeId: 'SUKANYA_SAMRIDDHI',
          name: 'Sukanya Samriddhi Yojana',
          description: 'Savings scheme for girl child below 10 years with attractive interest rates',
          keyBenefits: [
            'High interest rate savings account',
            'Tax benefits under Section 80C',
            'Maturity amount for education/marriage',
            'Flexible deposit options'
          ],
          eligibility: { gender: 'girls', ageRange: { min: 0, max: 10 } },
          category: 'financial',
          implementingAgency: 'Ministry of Finance - Post Office/Banks'
        },
        {
          schemeId: 'BETI_BACHAO',
          name: 'Beti Bachao, Beti Padhao',
          description: 'Awareness and education program for girl child empowerment',
          keyBenefits: [
            'Awareness campaigns for gender equality',
            'Education support and scholarships',
            'Community mobilization programs',
            'Girl child protection initiatives'
          ],
          eligibility: { gender: 'girls', ageRange: { min: 0, max: 18 } },
          category: 'development',
          implementingAgency: 'Ministry of Women and Child Development'
        },
        {
          schemeId: 'BALIKA_SAMRIDDHI',
          name: 'Balika Samriddhi Yojana',
          description: 'Scholarship and incentive program for girl children',
          keyBenefits: [
            'Birth incentive of ₹500',
            'Annual scholarships for education',
            'Support for continuing education',
            'Insurance coverage benefits'
          ],
          eligibility: { gender: 'girls', ageRange: { min: 0, max: 18 } },
          category: 'financial',
          implementingAgency: 'Ministry of Women and Child Development'
        },
        {
          schemeId: 'SPECIAL_NUTRITION_GIRLS',
          name: 'Special Nutrition Monitoring (Girls)',
          description: 'Focused nutrition program for girls with anemia prevention',
          keyBenefits: [
            'Regular hemoglobin testing',
            'Iron-rich food supplements',
            'Anemia prevention counseling',
            'Special care for malnourished girls'
          ],
          eligibility: { gender: 'girls', ageRange: { min: 3, max: 6 } },
          category: 'health',
          implementingAgency: 'ICDS - Ministry of Women and Child Development'
        },
        {
          schemeId: 'KUDUMBASHREE_GIRLS',
          name: 'Kudumbashree Child Development (Girls)',
          description: 'Kerala-specific program for girl child development and empowerment',
          keyBenefits: [
            'Community-based childcare support',
            'Women\'s group mentorship',
            'Skill development preparation',
            'Local governance participation awareness'
          ],
          eligibility: { gender: 'girls', ageRange: { min: 3, max: 6 } },
          category: 'development',
          implementingAgency: 'Kudumbashree - Government of Kerala'
        }
      ];

      await Scheme.insertMany(defaultSchemes);
      console.log('✅ Default welfare schemes initialized');
    }
  } catch (error) {
    console.error('❌ Error initializing schemes:', error);
  }
};

// Initialize schemes on startup
initializeSchemes();

// GET /api/schemes - Get all available schemes
router.get('/', authMiddleware, async (req, res) => {
  try {
    const schemes = await Scheme.find({ isActive: true }).sort({ category: 1, name: 1 });
    
    // Group schemes by gender eligibility
    const groupedSchemes = {
      both: schemes.filter(scheme => scheme.eligibility.gender === 'both'),
      boys: schemes.filter(scheme => scheme.eligibility.gender === 'boys'),
      girls: schemes.filter(scheme => scheme.eligibility.gender === 'girls')
    };
    
    res.json({
      success: true,
      data: {
        schemes: groupedSchemes,
        total: schemes.length
      }
    });
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch welfare schemes',
      error: error.message
    });
  }
});

// GET /api/schemes/child/:childId - Get schemes applicable for a specific child
router.get('/child/:childId', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Get child details to determine gender and age
    const child = await Child.findById(childId);
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found'
      });
    }
    
    // Calculate age
    const childAge = Math.floor((new Date() - new Date(child.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
    
    // Find applicable schemes
    const schemes = await Scheme.find({
      isActive: true,
      $or: [
        { 'eligibility.gender': 'both' },
        { 'eligibility.gender': child.gender.toLowerCase() }
      ],
      'eligibility.ageRange.min': { $lte: childAge },
      'eligibility.ageRange.max': { $gte: childAge }
    }).sort({ category: 1, name: 1 });
    
    // Get enrollment status for this child
    const enrollments = await Enrollment.find({ childId });
    const enrolledSchemeIds = enrollments.map(e => e.schemeId);
    
    // Add enrollment status to schemes
    const schemesWithStatus = schemes.map(scheme => ({
      ...scheme.toObject(),
      isEnrolled: enrolledSchemeIds.includes(scheme.schemeId),
      enrollmentData: enrollments.find(e => e.schemeId === scheme.schemeId)
    }));
    
    res.json({
      success: true,
      data: {
        child: {
          id: child._id,
          name: child.name,
          age: childAge,
          gender: child.gender
        },
        schemes: schemesWithStatus,
        total: schemes.length,
        enrolled: enrolledSchemeIds.length
      }
    });
  } catch (error) {
    console.error('Error fetching child schemes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child schemes',
      error: error.message
    });
  }
});

// POST /api/schemes/enroll - Enroll a child in a scheme
router.post('/enroll', authMiddleware, async (req, res) => {
  try {
    const { childId, schemeId } = req.body;
    const parentId = req.user.userId;
    
    if (!childId || !schemeId) {
      return res.status(400).json({
        success: false,
        message: 'Child ID and Scheme ID are required'
      });
    }
    
    // Check if child exists and belongs to this parent
    const child = await Child.findOne({ _id: childId, parentEmail: req.user.email });
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or unauthorized'
      });
    }
    
    // Check if scheme exists
    const scheme = await Scheme.findOne({ schemeId, isActive: true });
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }
    
    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({ childId, schemeId });
    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: 'Child is already enrolled in this scheme'
      });
    }
    
    // Create new enrollment
    const enrollment = new Enrollment({
      childId,
      schemeId,
      parentId,
      status: 'enrolled'
    });
    
    await enrollment.save();
    
    res.status(201).json({
      success: true,
      message: `Successfully enrolled ${child.name} in ${scheme.name}`,
      data: {
        enrollment: {
          id: enrollment._id,
          applicationNumber: enrollment.applicationNumber,
          enrollmentDate: enrollment.enrollmentDate,
          status: enrollment.status
        },
        child: {
          id: child._id,
          name: child.name
        },
        scheme: {
          id: scheme.schemeId,
          name: scheme.name
        }
      }
    });
    
  } catch (error) {
    console.error('Error enrolling in scheme:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to enroll in scheme',
      error: error.message
    });
  }
});

// GET /api/schemes/enrollments - Get all enrollments for the logged-in parent
router.get('/enrollments', authMiddleware, async (req, res) => {
  try {
    const parentId = req.user.userId;
    
    // Get all children for this parent
    const children = await Child.find({ parentEmail: req.user.email });
    const childIds = children.map(child => child._id);
    
    // Get all enrollments for these children
    const enrollments = await Enrollment.find({ childId: { $in: childIds } })
      .populate('childId', 'name gender dateOfBirth')
      .sort({ enrollmentDate: -1 });
    
    // Get scheme details
    const schemeIds = enrollments.map(e => e.schemeId);
    const schemes = await Scheme.find({ schemeId: { $in: schemeIds } });
    
    // Combine enrollment with scheme details
    const enrichedEnrollments = enrollments.map(enrollment => {
      const scheme = schemes.find(s => s.schemeId === enrollment.schemeId);
      return {
        ...enrollment.toObject(),
        schemeDetails: scheme
      };
    });
    
    res.json({
      success: true,
      data: {
        enrollments: enrichedEnrollments,
        total: enrollments.length,
        children: children.map(child => ({
          id: child._id,
          name: child.name,
          enrollmentCount: enrollments.filter(e => e.childId._id.toString() === child._id.toString()).length
        }))
      }
    });
    
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch enrollments',
      error: error.message
    });
  }
});

// GET /api/schemes/enrollments/:childId - Get enrollments for a specific child
router.get('/enrollments/:childId', authMiddleware, async (req, res) => {
  try {
    const { childId } = req.params;
    
    // Verify child belongs to this parent
    const child = await Child.findOne({ _id: childId, parentEmail: req.user.email });
    if (!child) {
      return res.status(404).json({
        success: false,
        message: 'Child not found or unauthorized'
      });
    }
    
    const enrollments = await Enrollment.find({ childId }).sort({ enrollmentDate: -1 });
    
    // Get scheme details
    const schemeIds = enrollments.map(e => e.schemeId);
    const schemes = await Scheme.find({ schemeId: { $in: schemeIds } });
    
    const enrichedEnrollments = enrollments.map(enrollment => {
      const scheme = schemes.find(s => s.schemeId === enrollment.schemeId);
      return {
        ...enrollment.toObject(),
        schemeDetails: scheme
      };
    });
    
    res.json({
      success: true,
      data: {
        child: {
          id: child._id,
          name: child.name
        },
        enrollments: enrichedEnrollments,
        total: enrollments.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching child enrollments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child enrollments',
      error: error.message
    });
  }
});

module.exports = router;