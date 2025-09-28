const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Child = require('../models/Child');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createTestParent = async () => {
  try {
    await connectDB();

    // Test parent data
    const parentEmail = 'lekha.parent@test.com';
    const parentPassword = 'testparent123';
    const parentPhone = '9876543210';

    console.log('🔍 Checking if test parent already exists...');
    
    // Check if parent already exists
    let parent = await User.findOne({ email: parentEmail });
    if (parent) {
      console.log('✅ Test parent already exists:', parent.name);
      
      // Update phone if missing
      if (!parent.phone) {
        parent.phone = parentPhone;
        await parent.save();
        console.log('📞 Updated parent phone number');
      }

      console.log('👶 Checking for children...');
      const existingChildren = await Child.find({
        $or: [
          { parentEmail: parentEmail },
          { parentPhone: parentPhone }
        ]
      });
      console.log(`Found ${existingChildren.length} children for this parent`);

      if (existingChildren.length === 0) {
        console.log('👶 Creating children for existing parent...');
        // Continue to create children for existing parent
      } else {
        console.log('✅ Children already exist for this parent');
        return;
      }
    }

    if (!parent) {
      console.log('👤 Creating test parent...');

      // Hash password
      const hashedPassword = await bcrypt.hash(parentPassword, 12);

      // Create test parent
      parent = new User({
      firebaseUid: `direct-${Date.now()}-testparent`,
      name: 'Lekha Arun',
      email: parentEmail,
      phone: parentPhone,
      role: 'parent',
      hashedPassword: hashedPassword,
      address: {
        street: '123 Test Street',
        locality: 'Test Area', 
        city: 'Kottayam',
        state: 'Kerala',
        pincode: '686001'
      },
      roleSpecificData: {
        parentDetails: {
          personalInfo: {
            parentName: 'Lekha Arun',
            age: '35',
            gender: 'female',
            educationLevel: 'graduate',
            primaryLanguage: 'Malayalam'
          },
          contactInfo: {
            email: parentEmail,
            phone: parentPhone
          },
          familyDetails: {
            maritalStatus: 'married',
            occupation: 'teacher',
            monthlyIncome: '30000-50000',
            numberOfChildren: 2
          }
        }
      },
      isActive: true,
      isVerified: true
      });

      await parent.save();
      console.log('✅ Test parent created successfully:', parent.name);
    }

    // Create test children for this parent
    console.log('👶 Creating test children...');

    const child1 = new Child({
      name: 'Aarav Arun',
      dateOfBirth: new Date('2019-05-15'), // About 4 years old
      gender: 'male',
      parentName: 'Lekha Arun',
      parentPhone: parentPhone,
      parentEmail: parentEmail,
      relationToChild: 'mother',
      address: {
        street: '123 Test Street',
        village: 'Mankombu',
        block: 'Kottayam',
        district: 'Kottayam',
        state: 'Kerala',
        pincode: '686001'
      },
      anganwadiCenter: 'Akkarakunnu Anganwadi',
      currentWeight: 14.5,
      currentHeight: 95,
      bloodGroup: 'O+',
      nutritionStatus: 'normal',
      vaccinations: [
        { vaccineName: 'BCG', dateGiven: new Date('2019-06-01') },
        { vaccineName: 'OPV', dateGiven: new Date('2019-07-15') },
        { vaccineName: 'DPT', dateGiven: new Date('2019-08-15') }
      ],
      status: 'active',
      registeredBy: parent._id
    });

    const child2 = new Child({
      name: 'Priya Arun',
      dateOfBirth: new Date('2021-03-20'), // About 2 years old
      gender: 'female',
      parentName: 'Lekha Arun',
      parentPhone: parentPhone,
      parentEmail: parentEmail,
      relationToChild: 'mother',
      address: {
        street: '123 Test Street',
        village: 'Mankombu',
        block: 'Kottayam',
        district: 'Kottayam',
        state: 'Kerala',
        pincode: '686001'
      },
      anganwadiCenter: 'Akkarakunnu Anganwadi',
      currentWeight: 11.2,
      currentHeight: 78,
      bloodGroup: 'A+',
      nutritionStatus: 'normal',
      vaccinations: [
        { vaccineName: 'BCG', dateGiven: new Date('2021-04-01') },
        { vaccineName: 'OPV', dateGiven: new Date('2021-05-15') }
      ],
      status: 'active',
      registeredBy: parent._id
    });

    await child1.save();
    await child2.save();

    console.log('✅ Test children created successfully:');
    console.log(`   - ${child1.name} (${child1.age} years old)`);
    console.log(`   - ${child2.name} (${child2.age} years old)`);

    console.log('\n🎯 Test Parent Login Details:');
    console.log(`   Email: ${parentEmail}`);
    console.log(`   Password: ${parentPassword}`);
    console.log(`   Role: parent`);
    console.log(`   Phone: ${parentPhone}`);

  } catch (error) {
    console.error('❌ Error creating test parent:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 MongoDB disconnected');
  }
};

// Run the script
createTestParent();