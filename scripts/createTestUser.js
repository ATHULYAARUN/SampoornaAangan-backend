const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create test users
const createTestUsers = async () => {
  try {
    // Test Parent
    const testParent = new User({
      name: 'Test Parent',
      email: 'parent@test.com',
      phone: '9876543210',
      role: 'parent',
      tempPassword: 'test123',
      firebaseUid: 'test-parent-uid-' + Date.now(),
      address: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        district: 'Test District',
        block: 'Test Block'
      },
      roleSpecificData: {
        parentDetails: {
          children: [{
            name: 'Test Child',
            age: 3,
            gender: 'Male'
          }],
          occupation: 'Software Engineer',
          familySize: 3
        }
      },
      isActive: true
    });

    // Test Adolescent Girl
    const testAdolescent = new User({
      name: 'Test Adolescent',
      email: 'adolescent@test.com',
      phone: '9876543211',
      role: 'adolescent-girl',
      tempPassword: 'test123',
      firebaseUid: 'test-adolescent-uid-' + Date.now(),
      address: {
        street: 'Test Street 2',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        district: 'Test District',
        block: 'Test Block'
      },
      roleSpecificData: {
        adolescentDetails: {
          age: 16,
          schoolName: 'Test School',
          class: '10th',
          guardianName: 'Test Guardian',
          guardianPhone: '+91 9876543212'
        }
      },
      isActive: true
    });

    // Test Anganwadi Worker (created by admin)
    const testWorker = new User({
      name: 'Test Anganwadi Worker',
      email: 'worker@test.com',
      phone: '9876543213',
      role: 'anganwadi-worker',
      tempPassword: 'worker123',
      firebaseUid: 'test-worker-uid-' + Date.now(),
      address: {
        street: 'Worker Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456',
        district: 'Test District',
        block: 'Test Block'
      },
      roleSpecificData: {
        anganwadiCenter: {
          name: 'Test Anganwadi Center',
          code: 'AWW001',
          location: 'Test Location'
        },
        qualification: 'Graduate',
        experience: '2 years'
      },
      isActive: true
    });

    // Check if users already exist
    const existingParent = await User.findOne({ email: 'parent@test.com' });
    const existingAdolescent = await User.findOne({ email: 'adolescent@test.com' });
    const existingWorker = await User.findOne({ email: 'worker@test.com' });

    if (!existingParent) {
      await testParent.save();
      console.log('✅ Test Parent created: parent@test.com / test123');
    } else {
      console.log('ℹ️ Test Parent already exists');
    }

    if (!existingAdolescent) {
      await testAdolescent.save();
      console.log('✅ Test Adolescent created: adolescent@test.com / test123');
    } else {
      console.log('ℹ️ Test Adolescent already exists');
    }

    if (!existingWorker) {
      await testWorker.save();
      console.log('✅ Test Worker created: worker@test.com / worker123');
    } else {
      console.log('ℹ️ Test Worker already exists');
    }

    console.log('\n📋 Test Users Summary:');
    console.log('Parent: parent@test.com / test123 (role: parent)');
    console.log('Adolescent: adolescent@test.com / test123 (role: adolescent-girl)');
    console.log('Worker: worker@test.com / worker123 (role: anganwadi-worker)');
    console.log('\nYou can now test login with these credentials!');

  } catch (error) {
    console.error('Error creating test users:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await createTestUsers();
  process.exit(0);
};

run();