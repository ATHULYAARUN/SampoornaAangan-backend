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

// Main menu
const showMenu = () => {
  console.log('\n🗄️ MONGODB DATABASE MANAGER');
  console.log('='.repeat(40));
  console.log('1. View all users');
  console.log('2. View all admins');
  console.log('3. Create new user');
  console.log('4. Create new admin');
  console.log('5. Delete user');
  console.log('6. Update user');
  console.log('7. Database statistics');
  console.log('8. Backup database');
  console.log('9. Exit');
  console.log('='.repeat(40));
};

// View all users
const viewUsers = async () => {
  try {
    const users = await User.find({}).select('name email role isActive createdAt');
    console.log('\n👥 ALL USERS');
    console.log('-'.repeat(50));
    
    if (users.length === 0) {
      console.log('No users found');
      return;
    }

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Role: ${user.role}`);
      console.log(`   ✅ Active: ${user.isActive}`);
      console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error viewing users:', error);
  }
};

// View all admins
const viewAdmins = async () => {
  try {
    const admins = await Admin.find({}).select('username email name role isActive createdAt');
    console.log('\n🔐 ALL ADMINS');
    console.log('-'.repeat(50));
    
    if (admins.length === 0) {
      console.log('No admins found');
      return;
    }

    admins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name || admin.username}`);
      console.log(`   👤 Username: ${admin.username}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🛡️ Role: ${admin.role}`);
      console.log(`   ✅ Active: ${admin.isActive}`);
      console.log(`   📅 Created: ${admin.createdAt.toLocaleDateString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error viewing admins:', error);
  }
};

// Create new user
const createUser = async () => {
  try {
    console.log('\n📝 CREATE NEW USER');
    console.log('-'.repeat(30));
    
    const name = await askQuestion('Enter name: ');
    const email = await askQuestion('Enter email: ');
    const phone = await askQuestion('Enter phone (10 digits): ');
    const role = await askQuestion('Enter role (parent/adolescent-girl/anganwadi-worker): ');
    const tempPassword = await askQuestion('Enter temporary password: ');

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone,
      role: role,
      tempPassword: tempPassword,
      firebaseUid: `manual-${Date.now()}`,
      address: {
        street: '',
        city: '',
        state: '',
        pincode: '',
        district: '',
        block: ''
      },
      isActive: true
    });

    await user.save();
    console.log('✅ User created successfully!');
    console.log(`📧 Email: ${user.email}`);
    console.log(`🔑 Temp Password: ${tempPassword}`);

  } catch (error) {
    console.error('❌ Error creating user:', error);
  }
};

// Database statistics
const showStats = async () => {
  try {
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    const userCount = await User.countDocuments();
    const adminCount = await Admin.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    
    console.log('\n📊 DATABASE STATISTICS');
    console.log('-'.repeat(40));
    console.log(`📁 Database: ${db.databaseName}`);
    console.log(`📦 Collections: ${stats.collections}`);
    console.log(`📄 Total Documents: ${stats.objects}`);
    console.log(`💾 Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`👥 Total Users: ${userCount}`);
    console.log(`✅ Active Users: ${activeUsers}`);
    console.log(`🔐 Total Admins: ${adminCount}`);
    
  } catch (error) {
    console.error('❌ Error getting stats:', error);
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

// Main application loop
const runApp = async () => {
  await connectDB();
  
  while (true) {
    showMenu();
    const choice = await askQuestion('\nEnter your choice (1-9): ');
    
    switch (choice) {
      case '1':
        await viewUsers();
        break;
      case '2':
        await viewAdmins();
        break;
      case '3':
        await createUser();
        break;
      case '4':
        console.log('Admin creation feature - coming soon!');
        break;
      case '5':
        console.log('User deletion feature - coming soon!');
        break;
      case '6':
        console.log('User update feature - coming soon!');
        break;
      case '7':
        await showStats();
        break;
      case '8':
        console.log('Database backup feature - coming soon!');
        break;
      case '9':
        console.log('👋 Goodbye!');
        rl.close();
        process.exit(0);
        break;
      default:
        console.log('❌ Invalid choice. Please try again.');
    }
    
    await askQuestion('\nPress Enter to continue...');
  }
};

// Run the application
runApp().catch(console.error);