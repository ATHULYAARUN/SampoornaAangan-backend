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

// View database contents
const viewDatabase = async () => {
  try {
    console.log('\n📊 DATABASE OVERVIEW');
    console.log('='.repeat(50));

    // Get database stats
    const db = mongoose.connection.db;
    const stats = await db.stats();
    console.log(`📁 Database: ${db.databaseName}`);
    console.log(`📦 Collections: ${stats.collections}`);
    console.log(`📄 Documents: ${stats.objects}`);
    console.log(`💾 Data Size: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n👥 USERS COLLECTION');
    console.log('-'.repeat(30));
    
    const users = await User.find({}).select('name email role isActive createdAt');
    if (users.length === 0) {
      console.log('No users found');
    } else {
      console.log(`Total Users: ${users.length}\n`);
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   👤 Role: ${user.role}`);
        console.log(`   ✅ Active: ${user.isActive}`);
        console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    console.log('\n🔐 ADMINS COLLECTION');
    console.log('-'.repeat(30));
    
    const admins = await Admin.find({}).select('username email name role isActive createdAt');
    if (admins.length === 0) {
      console.log('No admins found');
    } else {
      console.log(`Total Admins: ${admins.length}\n`);
      admins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.name || admin.username}`);
        console.log(`   👤 Username: ${admin.username}`);
        console.log(`   📧 Email: ${admin.email}`);
        console.log(`   🛡️ Role: ${admin.role}`);
        console.log(`   ✅ Active: ${admin.isActive}`);
        console.log(`   📅 Created: ${admin.createdAt.toLocaleDateString()}`);
        console.log('');
      });
    }

    // Show collections in database
    console.log('\n📚 ALL COLLECTIONS');
    console.log('-'.repeat(30));
    const collections = await db.listCollections().toArray();
    collections.forEach(collection => {
      console.log(`📁 ${collection.name}`);
    });

  } catch (error) {
    console.error('❌ Error viewing database:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await viewDatabase();
  process.exit(0);
};

run();