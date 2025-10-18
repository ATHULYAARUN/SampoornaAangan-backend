// verify-admin-password.js - Test password comparison
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://sampoornaadmin:qiEbNqkB6fhm-2G@cluster0.8tilqvr.mongodb.net/sampoornaangan?retryWrites=true&w=majority&appName=Cluster0';

// Import Admin model
const Admin = require('./models/Admin');

async function verifyPassword() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to MongoDB\n');

    // Find admin
    const admin = await Admin.findOne({
      email: 'admin@sampoornaangan.gov.in'
    });

    if (!admin) {
      console.log('❌ Admin not found');
      await mongoose.disconnect();
      return;
    }

    console.log('✅ Admin found:', admin.email);
    console.log('   Username:', admin.username);
    console.log('   Password hash:', admin.password);
    console.log();

    // Test password directly with bcrypt
    const testPassword = 'admin123';
    console.log('Testing password:', testPassword);
    
    const isValidDirect = await bcrypt.compare(testPassword, admin.password);
    console.log('Direct bcrypt.compare result:', isValidDirect);
    
    // Test with model method
    const isValidMethod = await admin.comparePassword(testPassword);
    console.log('Model comparePassword result:', isValidMethod);

    await mongoose.disconnect();

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await mongoose.disconnect();
  }
}

verifyPassword();
