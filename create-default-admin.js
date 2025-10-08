const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const createDefaultAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('✅ Connected to MongoDB');

    // Check if admin exists
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('✅ Default admin already exists!');
      console.log('📧 Email:', existingAdmin.email);
      console.log('👤 Username:', existingAdmin.username);
      console.log('🔐 Default password: admin (change this after login!)');
      process.exit(0);
    }

    // Create default admin
    const defaultAdmin = new Admin({
      username: 'admin',
      email: 'admin@sampoornaangan.gov.in',
      password: 'admin', // This will be hashed automatically
      name: 'Super Administrator',
      role: 'super-admin',
      isVerified: true,
      isActive: true,
    });

    await defaultAdmin.save();
    console.log('✅ Default admin created successfully!');
    console.log('📧 Email: admin@sampoornaangan.gov.in');
    console.log('👤 Username: admin');
    console.log('🔐 Password: admin');
    console.log('⚠️  Please change the default password after first login!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

createDefaultAdmin();