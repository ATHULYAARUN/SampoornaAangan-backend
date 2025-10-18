// update-admin-password.js - Properly update admin password with pre-save hook
const mongoose = require('mongoose');
const readline = require('readline');

// MongoDB connection string
const MONGODB_URI = 'mongodb+srv://sampoornaadmin:qiEbNqkB6fhm-2G@cluster0.8tilqvr.mongodb.net/sampoornaangan?retryWrites=true&w=majority&appName=Cluster0';

// Import Admin model
const Admin = require('./models/Admin');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function updateAdminPassword() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('✅ Connected to MongoDB\n');

    // Get admin identifier
    const identifier = await question('Enter admin email or username: ');
    
    // Find admin
    const admin = await Admin.findOne({
      $or: [
        { email: identifier.toLowerCase().trim() },
        { username: identifier.toLowerCase().trim() }
      ]
    });

    if (!admin) {
      console.log('❌ Admin not found with identifier:', identifier);
      await mongoose.disconnect();
      rl.close();
      return;
    }

    console.log('✅ Admin found:', admin.email);
    console.log('   Username:', admin.username);
    console.log('   Name:', admin.name);
    console.log();

    // Get new password
    const newPassword = await question('Enter new password: ');

    if (!newPassword || newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      await mongoose.disconnect();
      rl.close();
      return;
    }

    // Update password using .save() to trigger pre-save hook
    admin.password = newPassword;
    await admin.save();

    console.log('\n✅ Admin password updated successfully!');
    console.log('\nYou can now login with:');
    console.log('  Email:', admin.email);
    console.log('  Username:', admin.username);
    console.log('  Password:', newPassword);

    await mongoose.disconnect();
    rl.close();

  } catch (error) {
    console.error('❌ Error updating password:', error.message);
    await mongoose.disconnect();
    rl.close();
  }
}

updateAdminPassword();
