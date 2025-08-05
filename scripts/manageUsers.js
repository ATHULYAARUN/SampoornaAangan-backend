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

// Display menu
const showMenu = () => {
  console.log('\n🔧 USER MANAGEMENT MENU');
  console.log('='.repeat(40));
  console.log('1. View all users');
  console.log('2. Remove test users');
  console.log('3. View real users only');
  console.log('4. Create sample real user');
  console.log('5. Reset all user data (DANGER!)');
  console.log('6. Exit');
  console.log('='.repeat(40));
};

// View all users
const viewAllUsers = async () => {
  try {
    console.log('\n👥 ALL USERS');
    console.log('-'.repeat(30));
    
    const users = await User.find({}).select('name email role isActive createdAt tempPassword hashedPassword');
    
    if (users.length === 0) {
      console.log('No users found');
      return;
    }
    
    console.log(`Total Users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      const authType = user.tempPassword ? 'Admin-created' : user.hashedPassword ? 'Self-registered' : 'Unknown';
      const isTestUser = user.email.includes('@test.com');
      
      console.log(`${index + 1}. ${user.name} ${isTestUser ? '(TEST)' : ''}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   🔐 Auth Type: ${authType}`);
      console.log(`   ✅ Active: ${user.isActive}`);
      console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error viewing users:', error);
  }
};

// Remove test users
const removeTestUsers = async () => {
  try {
    console.log('\n🗑️ REMOVING TEST USERS');
    console.log('-'.repeat(30));
    
    const testUsers = await User.find({ email: { $regex: '@test\.com$' } });
    
    if (testUsers.length === 0) {
      console.log('No test users found');
      return;
    }
    
    console.log(`Found ${testUsers.length} test users:`);
    testUsers.forEach(user => {
      console.log(`- ${user.name} (${user.email})`);
    });
    
    const result = await User.deleteMany({ email: { $regex: '@test\.com$' } });
    console.log(`\n✅ Removed ${result.deletedCount} test users`);
    
  } catch (error) {
    console.error('❌ Error removing test users:', error);
  }
};

// View real users only
const viewRealUsers = async () => {
  try {
    console.log('\n👥 REAL USERS ONLY');
    console.log('-'.repeat(30));
    
    const users = await User.find({ 
      email: { $not: { $regex: '@test\.com$' } }
    }).select('name email role isActive createdAt hashedPassword');
    
    if (users.length === 0) {
      console.log('No real users found');
      console.log('💡 Users can register at: http://localhost:5174/register');
      return;
    }
    
    console.log(`Total Real Users: ${users.length}\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   🔐 Self-registered: ${!!user.hashedPassword}`);
      console.log(`   ✅ Active: ${user.isActive}`);
      console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error viewing real users:', error);
  }
};

// Create sample real user
const createSampleUser = async () => {
  try {
    console.log('\n👤 CREATING SAMPLE REAL USER');
    console.log('-'.repeat(30));
    
    const bcrypt = require('bcryptjs');
    
    // Sample parent user
    const sampleUser = new User({
      name: 'Sample Parent',
      email: 'sample.parent@gmail.com',
      phone: '9876543210',
      role: 'parent',
      hashedPassword: await bcrypt.hash('password123', 12),
      firebaseUid: `real-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      address: {
        street: 'Sample Street',
        city: 'Sample City',
        state: 'Kerala',
        pincode: '686522',
        district: 'Kottayam',
        block: 'Sample Block'
      },
      roleSpecificData: {
        parentDetails: {
          children: [{
            name: 'Sample Child',
            age: 4,
            gender: 'Female'
          }],
          occupation: 'Teacher',
          familySize: 3
        }
      },
      isActive: true,
      isVerified: true
    });

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'sample.parent@gmail.com' });
    
    if (existingUser) {
      console.log('ℹ️ Sample user already exists');
      return;
    }

    await sampleUser.save();
    console.log('✅ Sample user created successfully!');
    console.log('📧 Email: sample.parent@gmail.com');
    console.log('🔑 Password: password123');
    console.log('👤 Role: parent');
    console.log('\n💡 You can now test login with these credentials');
    
  } catch (error) {
    console.error('❌ Error creating sample user:', error);
  }
};

// Reset all user data (dangerous!)
const resetAllUsers = async () => {
  try {
    console.log('\n⚠️ DANGER: RESET ALL USER DATA');
    console.log('-'.repeat(30));
    console.log('This will delete ALL users except admins!');
    console.log('Type "CONFIRM DELETE" to proceed:');
    
    // In a real script, you'd use readline for input
    // For now, just show the warning
    console.log('❌ Operation cancelled for safety');
    console.log('💡 To actually reset, modify this script manually');
    
  } catch (error) {
    console.error('❌ Error resetting users:', error);
  }
};

// Main menu handler
const handleMenuChoice = async (choice) => {
  switch (choice) {
    case '1':
      await viewAllUsers();
      break;
    case '2':
      await removeTestUsers();
      break;
    case '3':
      await viewRealUsers();
      break;
    case '4':
      await createSampleUser();
      break;
    case '5':
      await resetAllUsers();
      break;
    case '6':
      console.log('👋 Goodbye!');
      process.exit(0);
    default:
      console.log('❌ Invalid choice');
  }
};

// Run the script
const run = async () => {
  await connectDB();
  
  // Get command line argument
  const choice = process.argv[2];
  
  if (choice) {
    await handleMenuChoice(choice);
  } else {
    showMenu();
    console.log('\n💡 Usage: node manageUsers.js [1-6]');
    console.log('Example: node manageUsers.js 3  (to view real users)');
  }
  
  process.exit(0);
};

run();