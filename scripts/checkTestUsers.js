const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

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

// Check test users authentication fields
const checkTestUsers = async () => {
  try {
    console.log('\n🔍 CHECKING TEST USERS AUTHENTICATION');
    console.log('='.repeat(50));

    const testEmails = ['parent@test.com', 'adolescent@test.com'];
    
    for (const email of testEmails) {
      console.log(`\n📧 Checking: ${email}`);
      console.log('-'.repeat(30));
      
      const user = await User.findOne({ email: email });
      
      if (!user) {
        console.log('❌ User not found');
        continue;
      }
      
      console.log(`👤 Name: ${user.name}`);
      console.log(`🎭 Role: ${user.role}`);
      console.log(`✅ Active: ${user.isActive}`);
      console.log(`🔥 Firebase UID: ${user.firebaseUid}`);
      console.log(`🔑 Has tempPassword: ${!!user.tempPassword}`);
      console.log(`🔒 Has hashedPassword: ${!!user.hashedPassword}`);
      
      if (user.tempPassword) {
        console.log(`🔑 Temp Password: ${user.tempPassword}`);
      }
      
      console.log(`📅 Created: ${user.createdAt}`);
      console.log(`📅 Updated: ${user.updatedAt}`);
    }

  } catch (error) {
    console.error('❌ Error checking test users:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await checkTestUsers();
  process.exit(0);
};

run();