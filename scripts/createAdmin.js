const mongoose = require('mongoose');
const Admin = require('../models/Admin');
require('dotenv').config();

const createDefaultAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { email: 'admin@sampoornaangan.gov.in' },
        { username: 'admin' }
      ]
    });

    if (existingAdmin) {
      console.log('Admin already exists:', existingAdmin.email);
      return;
    }

    // Create default admin
    const defaultAdmin = new Admin({
      username: 'admin',
      email: 'admin@sampoornaangan.gov.in',
      password: 'admin123', // This will be hashed by the pre-save middleware
      name: 'Super Administrator',
      role: 'super-admin',
      isVerified: true,
      isActive: true,
    });

    await defaultAdmin.save();
    console.log('✅ Default admin created successfully');
    console.log('Email:', defaultAdmin.email);
    console.log('Username:', defaultAdmin.username);
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createDefaultAdmin();