const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Admin = require('../models/Admin');

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

// Remove test data
const removeTestData = async () => {
  try {
    console.log('🗑️ REMOVING TEST DATA...');
    console.log('='.repeat(40));
    
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
    console.log('Your database is now clean and ready for real users.');
    
  } catch (error) {
    console.error('❌ Error cleaning test data:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await removeTestData();
  process.exit(0);
};

run().catch(console.error);