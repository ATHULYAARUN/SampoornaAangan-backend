const mongoose = require('mongoose');
require('dotenv').config();

// Import the Child model
const Child = require('./models/Child');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Test child data
const testChildData = {
  name: 'Test Child',
  dateOfBirth: new Date('2020-01-15'),
  gender: 'male',
  parentName: 'Test Parent',
  parentPhone: '9876543210',
  parentEmail: '', // Empty email to test validation
  relationToChild: 'mother',
  address: {
    street: '123 Test Street',
    village: 'Test Village',
    block: 'Test Block',
    district: 'Test District',
    state: 'Test State',
    pincode: '123456'
  },
  anganwadiCenter: 'Test Anganwadi Center',
  registeredBy: new mongoose.Types.ObjectId(), // Mock ObjectId
  birthWeight: 3.2,
  currentWeight: 15.5,
  currentHeight: 95,
  bloodGroup: 'O+',
  medicalHistory: {
    allergies: ['Peanuts'],
    chronicConditions: [],
    disabilities: [],
    medications: []
  },
  specialNeeds: '',
  notes: 'Test registration'
};

async function testChildRegistration() {
  try {
    await connectDB();
    
    console.log('🧪 Testing Child Registration...');
    console.log('Test data:', JSON.stringify(testChildData, null, 2));
    
    // Create and validate child
    const child = new Child(testChildData);
    
    // Validate without saving first
    const validationError = child.validateSync();
    if (validationError) {
      console.log('❌ Validation failed:');
      Object.values(validationError.errors).forEach(error => {
        console.log(`  - ${error.path}: ${error.message}`);
      });
      return;
    }
    
    console.log('✅ Validation passed');
    
    // Try to save
    await child.save();
    console.log('✅ Child saved successfully');
    console.log('Child ID:', child._id);
    
    // Clean up - remove the test child
    await Child.findByIdAndDelete(child._id);
    console.log('✅ Test child removed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.name === 'ValidationError') {
      console.log('Validation errors:');
      Object.values(error.errors).forEach(err => {
        console.log(`  - ${err.path}: ${err.message}`);
      });
    }
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
}

// Test with different email scenarios
async function testEmailValidation() {
  try {
    await connectDB();
    
    console.log('🧪 Testing Email Validation...');
    
    const emailTests = [
      { email: '', description: 'Empty email' },
      { email: undefined, description: 'Undefined email' },
      { email: 'test@example.com', description: 'Valid email' },
      { email: 'invalid-email', description: 'Invalid email' },
      { email: 'test@', description: 'Incomplete email' }
    ];
    
    for (const test of emailTests) {
      console.log(`\nTesting: ${test.description} (${test.email})`);
      
      const testData = {
        ...testChildData,
        parentEmail: test.email,
        registeredBy: new mongoose.Types.ObjectId()
      };
      
      const child = new Child(testData);
      const validationError = child.validateSync();
      
      if (validationError && validationError.errors.parentEmail) {
        console.log(`❌ ${validationError.errors.parentEmail.message}`);
      } else {
        console.log('✅ Email validation passed');
      }
    }
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run tests
console.log('🚀 Starting Child Registration Debug Tests...\n');

// Uncomment the test you want to run:
testChildRegistration();
// testEmailValidation();
