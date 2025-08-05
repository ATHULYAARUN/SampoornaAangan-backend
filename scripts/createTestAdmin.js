const mongoose = require('mongoose');
require('dotenv').config();

// Import Admin model
const Admin = require('../models/Admin');

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

// Create test admin
const createTestAdmin = async () => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@test.com' });
    
    if (existingAdmin) {
      console.log('ℹ️ Test Admin already exists');
      console.log('📋 Admin Credentials: admin@test.com / admin123');
      return;
    }

    // Create test admin
    const testAdmin = new Admin({
      username: 'testadmin',
      email: 'admin@test.com',
      password: 'admin123', // This will be hashed by the model
      name: 'Test Administrator',
      role: 'super-admin',
      permissions: ['all'],
      isActive: true
    });

    await testAdmin.save();
    console.log('✅ Test Admin created: admin@test.com / admin123');
    console.log('📋 Admin Credentials: admin@test.com / admin123');

  } catch (error) {
    console.error('Error creating test admin:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await createTestAdmin();
  process.exit(0);
};

run();