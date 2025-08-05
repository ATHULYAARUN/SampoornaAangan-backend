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

// Show dashboard statistics
const showDashboard = async () => {
  try {
    console.log('\n📊 USER MANAGEMENT DASHBOARD');
    console.log('='.repeat(60));
    
    // Get counts
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalAdmins = await Admin.countDocuments();
    const activeAdmins = await Admin.countDocuments({ isActive: true });
    
    // Role-wise counts
    const parentCount = await User.countDocuments({ role: 'parent' });
    const adolescentCount = await User.countDocuments({ role: 'adolescent-girl' });
    const workerCount = await User.countDocuments({ role: 'anganwadi-worker' });
    const ashaCount = await User.countDocuments({ role: 'asha-volunteer' });
    const sanitationCount = await User.countDocuments({ role: 'sanitation-worker' });
    
    // Recent users (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentUsers = await User.countDocuments({ createdAt: { $gte: weekAgo } });
    
    console.log('📈 OVERVIEW:');
    console.log(`👥 Total Users: ${totalUsers} (${activeUsers} active)`);
    console.log(`🔐 Total Admins: ${totalAdmins} (${activeAdmins} active)`);
    console.log(`🆕 New Users (7 days): ${recentUsers}`);
    
    console.log('\n🎭 USERS BY ROLE:');
    console.log(`👨‍👩‍👧‍👦 Parents/Guardians: ${parentCount}`);
    console.log(`👧 Adolescent Girls: ${adolescentCount}`);
    console.log(`🏫 Anganwadi Workers: ${workerCount}`);
    console.log(`🏥 ASHA Volunteers: ${ashaCount}`);
    console.log(`🧹 Sanitation Workers: ${sanitationCount}`);
    
    // Location-wise stats
    const locationStats = await User.aggregate([
      { $match: { 'address.city': { $ne: '' } } },
      { $group: { _id: '$address.city', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    if (locationStats.length > 0) {
      console.log('\n📍 TOP CITIES:');
      locationStats.forEach((stat, index) => {
        console.log(`${index + 1}. ${stat._id}: ${stat.count} users`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error showing dashboard:', error);
  }
};

// List all users with details
const listAllUsers = async () => {
  try {
    const users = await User.find({})
      .select('name email phone role address.city address.district isActive createdAt')
      .sort({ createdAt: -1 });
    
    console.log('\n👥 ALL USERS');
    console.log('='.repeat(80));
    
    if (users.length === 0) {
      console.log('No users found');
      return;
    }
    
    users.forEach((user, index) => {
      const status = user.isActive ? '✅' : '❌';
      const location = user.address.city ? `${user.address.city}, ${user.address.district}` : 'N/A';
      
      console.log(`${index + 1}. ${status} ${user.name}`);
      console.log(`   📧 ${user.email} | 📱 ${user.phone}`);
      console.log(`   🎭 ${user.role} | 📍 ${location}`);
      console.log(`   📅 Created: ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error listing users:', error);
  }
};

// Search users
const searchUsers = async () => {
  try {
    const searchTerm = await askQuestion('Enter search term (name, email, or phone): ');
    
    if (!searchTerm.trim()) {
      console.log('❌ Please enter a search term');
      return;
    }
    
    const users = await User.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { phone: { $regex: searchTerm, $options: 'i' } }
      ]
    }).select('name email phone role address.city isActive');
    
    console.log(`\n🔍 SEARCH RESULTS FOR: "${searchTerm}"`);
    console.log('='.repeat(50));
    
    if (users.length === 0) {
      console.log('No users found matching the search term');
      return;
    }
    
    users.forEach((user, index) => {
      const status = user.isActive ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${user.name}`);
      console.log(`   📧 ${user.email} | 📱 ${user.phone}`);
      console.log(`   🎭 ${user.role} | 📍 ${user.address.city || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error searching users:', error);
  }
};

// Filter users by role
const filterByRole = async () => {
  try {
    console.log('\nSelect role to filter:');
    console.log('1. parent');
    console.log('2. adolescent-girl');
    console.log('3. anganwadi-worker');
    console.log('4. asha-volunteer');
    console.log('5. sanitation-worker');
    
    const choice = await askQuestion('Enter choice (1-5): ');
    
    const roleMap = {
      '1': 'parent',
      '2': 'adolescent-girl',
      '3': 'anganwadi-worker',
      '4': 'asha-volunteer',
      '5': 'sanitation-worker'
    };
    
    const selectedRole = roleMap[choice];
    if (!selectedRole) {
      console.log('❌ Invalid choice');
      return;
    }
    
    const users = await User.find({ role: selectedRole })
      .select('name email phone address.city address.district isActive createdAt')
      .sort({ createdAt: -1 });
    
    console.log(`\n🎭 USERS WITH ROLE: ${selectedRole.toUpperCase()}`);
    console.log('='.repeat(60));
    
    if (users.length === 0) {
      console.log(`No users found with role: ${selectedRole}`);
      return;
    }
    
    users.forEach((user, index) => {
      const status = user.isActive ? '✅' : '❌';
      const location = user.address.city ? `${user.address.city}, ${user.address.district}` : 'N/A';
      
      console.log(`${index + 1}. ${status} ${user.name}`);
      console.log(`   📧 ${user.email} | 📱 ${user.phone}`);
      console.log(`   📍 ${location} | 📅 ${user.createdAt.toLocaleDateString()}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error filtering users:', error);
  }
};

// Export users to CSV
const exportUsers = async () => {
  try {
    const users = await User.find({})
      .select('name email phone role address isActive createdAt roleSpecificData');
    
    if (users.length === 0) {
      console.log('❌ No users to export');
      return;
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // Create CSV content
    let csvContent = 'Name,Email,Phone,Role,City,District,State,Active,Created,Role Specific Data\n';
    
    users.forEach(user => {
      const roleData = JSON.stringify(user.roleSpecificData || {}).replace(/"/g, '""');
      csvContent += `"${user.name}","${user.email}","${user.phone}","${user.role}","${user.address.city}","${user.address.district}","${user.address.state}","${user.isActive}","${user.createdAt.toLocaleDateString()}","${roleData}"\n`;
    });
    
    // Save to file
    const exportPath = path.join(__dirname, `users_export_${Date.now()}.csv`);
    fs.writeFileSync(exportPath, csvContent);
    
    console.log(`✅ Users exported successfully to: ${exportPath}`);
    console.log(`📊 Total users exported: ${users.length}`);
    
  } catch (error) {
    console.error('❌ Error exporting users:', error);
  }
};

// Toggle user status
const toggleUserStatus = async () => {
  try {
    const email = await askQuestion('Enter user email to toggle status: ');
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    user.isActive = !user.isActive;
    await user.save();
    
    const status = user.isActive ? 'activated' : 'deactivated';
    console.log(`✅ User ${user.name} has been ${status}`);
    
  } catch (error) {
    console.error('❌ Error toggling user status:', error);
  }
};

// Main menu
const showMenu = () => {
  console.log('\n📊 USER MANAGEMENT DASHBOARD');
  console.log('='.repeat(40));
  console.log('1. Show dashboard overview');
  console.log('2. List all users');
  console.log('3. Search users');
  console.log('4. Filter users by role');
  console.log('5. Export users to CSV');
  console.log('6. Toggle user active status');
  console.log('7. Exit');
  console.log('='.repeat(40));
};

// Main application
const runApp = async () => {
  await connectDB();
  
  console.log('🎉 WELCOME TO USER MANAGEMENT DASHBOARD');
  console.log('Manage and view your SampoornaAngan users');
  
  // Show initial dashboard
  await showDashboard();
  
  while (true) {
    showMenu();
    const choice = await askQuestion('\nEnter your choice (1-7): ');
    
    try {
      switch (choice) {
        case '1':
          await showDashboard();
          break;
        case '2':
          await listAllUsers();
          break;
        case '3':
          await searchUsers();
          break;
        case '4':
          await filterByRole();
          break;
        case '5':
          await exportUsers();
          break;
        case '6':
          await toggleUserStatus();
          break;
        case '7':
          console.log('👋 Thank you for using the dashboard!');
          rl.close();
          process.exit(0);
          break;
        default:
          console.log('❌ Invalid choice. Please try again.');
      }
    } catch (error) {
      console.error('❌ An error occurred:', error.message);
    }
    
    await askQuestion('\nPress Enter to continue...');
  }
};

// Run the application
runApp().catch(console.error);