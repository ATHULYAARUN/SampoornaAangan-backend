const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5005;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// In-memory storage for enrollments
let enrollments = [];

// Mock schemes data
const schemes = [
  {
    id: 'pmcare',
    _id: 'pmcare',
    name: 'Pradhan Mantri Matru Vandana Yojana',
    category: 'nutrition',
    description: 'Cash incentive scheme for pregnant and lactating mothers for improved health and nutrition outcomes.',
    benefits: {
      amount: 5000,
      type: 'cash',
      duration: 'one-time'
    },
    eligibility: {
      minAge: 18,
      maxAge: 45,
      gender: 'female',
      income: 'Below poverty line'
    },
    documents: [
      'Aadhaar Card',
      'Bank Account Details',
      'Pregnancy Certificate',
      'Income Certificate'
    ]
  },
  {
    id: 'nutrition',
    _id: 'nutrition',
    name: 'Supplementary Nutrition Programme',
    category: 'nutrition',
    description: 'Daily hot cooked meals and supplementary nutrition for children aged 3-6 years.',
    benefits: {
      amount: 8,
      type: 'meals',
      duration: 'daily'
    },
    eligibility: {
      minAge: 3,
      maxAge: 6,
      gender: 'both',
      income: 'All categories'
    },
    documents: [
      'Birth Certificate',
      'Aadhaar Card',
      'Residence Proof'
    ]
  },
  {
    id: 'immunization',
    _id: 'immunization',
    name: 'Universal Immunization Programme',
    category: 'health',
    description: 'Free vaccination services for children to protect against preventable diseases.',
    benefits: {
      amount: 0,
      type: 'healthcare',
      duration: 'scheduled'
    },
    eligibility: {
      minAge: 0,
      maxAge: 6,
      gender: 'both',
      income: 'All categories'
    },
    documents: [
      'Birth Certificate',
      'Previous Vaccination Records'
    ]
  }
];

// Routes
app.get('/api/schemes', (req, res) => {
  console.log('📋 GET /api/schemes - Fetching schemes');
  res.json({
    success: true,
    data: {
      schemes: schemes
    },
    message: 'Schemes fetched successfully'
  });
});

app.get('/api/enrollments', (req, res) => {
  console.log('📋 GET /api/enrollments - Fetching enrollments');
  console.log('Current enrollments:', enrollments);
  res.json({
    success: true,
    data: enrollments,
    message: 'Enrollments fetched successfully'
  });
});

app.get('/api/enrollments/:childId', (req, res) => {
  const { childId } = req.params;
  console.log(`📋 GET /api/enrollments/${childId} - Fetching enrollments for child`);
  
  const childEnrollments = enrollments.filter(e => e.childId === childId);
  
  res.json({
    success: true,
    data: childEnrollments,
    message: 'Child enrollments fetched successfully'
  });
});

app.post('/api/enroll', (req, res) => {
  const { schemeId, parentName, childName, childId } = req.body;
  
  console.log('📝 POST /api/enroll - New enrollment request');
  console.log('Request body:', req.body);
  
  // Check if already enrolled
  const existingEnrollment = enrollments.find(e => 
    e.schemeId === schemeId && 
    (e.childId === childId || (e.parentName === parentName && e.childName === childName))
  );
  
  if (existingEnrollment) {
    return res.status(400).json({
      success: false,
      message: 'Already enrolled in this scheme'
    });
  }
  
  // Generate application number
  const applicationNumber = `APP${Date.now()}${Math.floor(Math.random() * 1000)}`;
  
  // Create enrollment record
  const enrollment = {
    id: Date.now().toString(),
    schemeId,
    parentName: parentName || 'Demo Parent',
    childName: childName || 'Demo Child',
    childId: childId || 'demo-child-1',
    applicationNumber,
    status: 'applied',
    appliedDate: new Date().toISOString(),
    scheme: schemes.find(s => s.id === schemeId)
  };
  
  enrollments.push(enrollment);
  
  console.log('✅ Enrollment created:', enrollment);
  console.log('📊 Total enrollments:', enrollments.length);
  
  res.json({
    success: true,
    data: {
      applicationNumber,
      enrollment
    },
    message: 'Successfully enrolled in scheme'
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Simple Enrollment Server Started
📍 Environment: development
🌐 Server running on port ${PORT}
📊 Health check: http://localhost:${PORT}/health
📚 API Base URL: http://localhost:${PORT}/api
🔧 Available endpoints:
   • GET  /api/schemes - Get welfare schemes
   • GET  /api/enrollments - Get all enrollments
   • GET  /api/enrollments/:childId - Get child enrollments
   • POST /api/enroll - Enroll in scheme
   
📋 Mock data: ${schemes.length} schemes loaded
💾 Enrollment storage: In-memory (${enrollments.length} enrollments)
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});