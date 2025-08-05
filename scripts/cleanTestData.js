const mongoose = require('mongoose');
const readline = require('readline');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Admin = require('../models/Admin');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

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

// Helper function to ask questions
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Show current test data
const showTestData = async () => {
  console.log('\n🗑️ CURRENT TEST DATA');
  console.log('='.repeat(50));
  
  const testUsers = await User.find({
    $or: [
      { email: { $regex: /test\.com$/ } },
      { name: { $regex: /^Test / } }
    ]
  }).select('name email role');
  
  const testAdmins = await Admin.find({
    $or: [
      { email: { $regex: /test\.com$/ } },
      { name: { $regex: /^Test / } }
    ]
  }).select('name email username role');
  
  console.log('\n👥 Test Users:');
  if (testUsers.length === 0) {
    console.log('   No test users found');
  } else {
    testUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
    });
  }
  
  console.log('\n🔐 Test Admins:');
  if (testAdmins.length === 0) {
    console.log('   No test admins found');
  } else {
    testAdmins.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.name || admin.username} (${admin.email}) - ${admin.role}`);
    });
  }
  
  return { testUsers: testUsers.length, testAdmins: testAdmins.length };
};

// Clean test data
const cleanTestData = async () => {
  try {
    console.log('\n🧹 CLEANING TEST DATA...');
    
    // Delete test users
    const userResult = await User.deleteMany({
      $or: [
        { email: { $regex: /test\.com$/ } },
        { name: { $regex: /^Test / } }
      ]
    });
    
    // Delete test admins
    const adminResult = await Admin.deleteMany({
      $or: [
        { email: { $regex: /test\.com$/ } },
        { name: { $regex: /^Test / } }
      ]
    });
    
    console.log(`✅ Deleted ${userResult.deletedCount} test users`);
    console.log(`✅ Deleted ${adminResult.deletedCount} test admins`);
    console.log('\n🎉 Test data cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
  }
};

// Main function
const run = async () => {
  await connectDB();
  
  console.log('🗑️ TEST DATA CLEANUP UTILITY');
  console.log('='.repeat(40));
  
  const counts = await showTestData();
  
  if (counts.testUsers === 0 && counts.testAdmins === 0) {
    console.log('\n✅ No test data found. Database is clean!');
    rl.close();
    process.exit(0);
  }
  
  console.log('\n⚠️ WARNING: This will permanently delete all test data!');
  const confirm = await askQuestion('\nDo you want to proceed? (yes/no): ');
  
  if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
    await cleanTestData();
  } else {
    console.log('❌ Operation cancelled');
  }
  
  rl.close();
  process.exit(0);
};

run().catch(console.error);