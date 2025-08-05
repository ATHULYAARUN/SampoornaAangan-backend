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

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Indian format)
const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// Create a new user
const createUser = async () => {
  try {
    console.log('\n👤 CREATE NEW USER');
    console.log('='.repeat(30));
    
    // Get user details
    let name, email, phone, role, tempPassword;
    
    // Name
    while (!name || name.trim().length < 2) {
      name = await askQuestion('Enter full name: ');
      if (!name || name.trim().length < 2) {
        console.log('❌ Name must be at least 2 characters long');
      }
    }
    
    // Email
    while (!email || !isValidEmail(email)) {
      email = await askQuestion('Enter email address: ');
      if (!email || !isValidEmail(email)) {
        console.log('❌ Please enter a valid email address');
        continue;
      }
      
      // Check if email already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      
      if (existingUser || existingAdmin) {
        console.log('❌ Email already exists. Please use a different email.');
        email = null;
      }
    }
    
    // Phone
    while (!phone || !isValidPhone(phone)) {
      phone = await askQuestion('Enter phone number (10 digits): ');
      if (!phone || !isValidPhone(phone)) {
        console.log('❌ Please enter a valid 10-digit phone number starting with 6-9');
      }
    }
    
    // Role
    console.log('\nAvailable roles:');
    console.log('1. parent - Parent/Guardian');
    console.log('2. adolescent-girl - Adolescent Girl');
    console.log('3. anganwadi-worker - Anganwadi Worker');
    console.log('4. asha-volunteer - ASHA Worker/Volunteer');
    console.log('5. sanitation-worker - Sanitation Worker');
    
    let roleChoice;
    while (!roleChoice || !['1', '2', '3', '4', '5'].includes(roleChoice)) {
      roleChoice = await askQuestion('Select role (1-5): ');
      if (!['1', '2', '3', '4', '5'].includes(roleChoice)) {
        console.log('❌ Please select a valid role (1-5)');
      }
    }
    
    const roleMap = {
      '1': 'parent',
      '2': 'adolescent-girl',
      '3': 'anganwadi-worker',
      '4': 'asha-volunteer',
      '5': 'sanitation-worker'
    };
    role = roleMap[roleChoice];
    
    // Temporary password
    while (!tempPassword || tempPassword.length < 6) {
      tempPassword = await askQuestion('Enter temporary password (min 6 characters): ');
      if (!tempPassword || tempPassword.length < 6) {
        console.log('❌ Password must be at least 6 characters long');
      }
    }
    
    // Address details
    console.log('\n📍 ADDRESS DETAILS (Optional - press Enter to skip):');
    const street = await askQuestion('Street/House No: ');
    const city = await askQuestion('City: ');
    const district = await askQuestion('District: ');
    const state = await askQuestion('State: ');
    const pincode = await askQuestion('Pincode: ');
    const block = await askQuestion('Block: ');
    
    // Role-specific data
    let roleSpecificData = {};
    
    if (role === 'parent') {
      console.log('\n👨‍👩‍👧‍👦 PARENT-SPECIFIC DETAILS:');
      const numberOfChildren = await askQuestion('Number of children: ');
      const childrenAges = await askQuestion('Children ages (comma-separated): ');
      roleSpecificData = {
        numberOfChildren: numberOfChildren || '0',
        childrenAges: childrenAges ? childrenAges.split(',').map(age => age.trim()) : []
      };
    } else if (role === 'adolescent-girl') {
      console.log('\n👧 ADOLESCENT-SPECIFIC DETAILS:');
      const age = await askQuestion('Age: ');
      const schoolName = await askQuestion('School name: ');
      const grade = await askQuestion('Grade/Class: ');
      roleSpecificData = {
        age: age || '',
        schoolName: schoolName || '',
        grade: grade || ''
      };
    } else if (role === 'anganwadi-worker') {
      console.log('\n🏫 ANGANWADI WORKER DETAILS:');
      const centerName = await askQuestion('Anganwadi Center name: ');
      const centerCode = await askQuestion('Center code: ');
      const experience = await askQuestion('Years of experience: ');
      roleSpecificData = {
        centerName: centerName || '',
        centerCode: centerCode || '',
        experience: experience || ''
      };
    }
    
    // Create user object
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      phone: phone,
      role: role,
      tempPassword: tempPassword,
      firebaseUid: `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      address: {
        street: street || '',
        city: city || '',
        district: district || '',
        state: state || '',
        pincode: pincode || '',
        block: block || ''
      },
      roleSpecificData: roleSpecificData,
      preferences: {
        language: 'en',
        notifications: {
          email: true,
          sms: true,
          push: true
        }
      },
      isActive: true,
      isVerified: false
    };
    
    // Save user
    const user = new User(userData);
    await user.save();
    
    console.log('\n✅ USER CREATED SUCCESSFULLY!');
    console.log('='.repeat(40));
    console.log(`👤 Name: ${user.name}`);
    console.log(`📧 Email: ${user.email}`);
    console.log(`📱 Phone: ${user.phone}`);
    console.log(`🎭 Role: ${user.role}`);
    console.log(`🔑 Temp Password: ${tempPassword}`);
    console.log(`📍 Location: ${user.address.city}, ${user.address.district}`);
    console.log('='.repeat(40));
    
    return user;
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    throw error;
  }
};

// Create admin user
const createAdmin = async () => {
  try {
    console.log('\n🔐 CREATE NEW ADMIN');
    console.log('='.repeat(30));
    
    let username, email, name, password;
    
    // Username
    while (!username || username.length < 3) {
      username = await askQuestion('Enter username (min 3 characters): ');
      if (!username || username.length < 3) {
        console.log('❌ Username must be at least 3 characters long');
        continue;
      }
      
      // Check if username exists
      const existingAdmin = await Admin.findOne({ username: username.toLowerCase() });
      if (existingAdmin) {
        console.log('❌ Username already exists. Please choose a different username.');
        username = null;
      }
    }
    
    // Email
    while (!email || !isValidEmail(email)) {
      email = await askQuestion('Enter email address: ');
      if (!email || !isValidEmail(email)) {
        console.log('❌ Please enter a valid email address');
        continue;
      }
      
      // Check if email exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
      
      if (existingUser || existingAdmin) {
        console.log('❌ Email already exists. Please use a different email.');
        email = null;
      }
    }
    
    // Name
    while (!name || name.trim().length < 2) {
      name = await askQuestion('Enter full name: ');
      if (!name || name.trim().length < 2) {
        console.log('❌ Name must be at least 2 characters long');
      }
    }
    
    // Password
    while (!password || password.length < 8) {
      password = await askQuestion('Enter password (min 8 characters): ');
      if (!password || password.length < 8) {
        console.log('❌ Password must be at least 8 characters long');
      }
    }
    
    // Role
    console.log('\nAdmin roles:');
    console.log('1. super-admin - Full access');
    console.log('2. admin - Limited access');
    
    let roleChoice;
    while (!roleChoice || !['1', '2'].includes(roleChoice)) {
      roleChoice = await askQuestion('Select admin role (1-2): ');
      if (!['1', '2'].includes(roleChoice)) {
        console.log('❌ Please select a valid role (1-2)');
      }
    }
    
    const adminRole = roleChoice === '1' ? 'super-admin' : 'admin';
    const permissions = roleChoice === '1' ? ['all'] : ['read', 'write'];
    
    // Create admin
    const adminData = {
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: password, // Will be hashed by the model
      name: name.trim(),
      role: adminRole,
      permissions: permissions,
      isActive: true
    };
    
    const admin = new Admin(adminData);
    await admin.save();
    
    console.log('\n✅ ADMIN CREATED SUCCESSFULLY!');
    console.log('='.repeat(40));
    console.log(`👤 Name: ${admin.name}`);
    console.log(`🔑 Username: ${admin.username}`);
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🛡️ Role: ${admin.role}`);
    console.log(`🔐 Password: ${password}`);
    console.log('='.repeat(40));
    
    return admin;
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    throw error;
  }
};

// Main menu
const showMenu = () => {
  console.log('\n👥 REAL USER CREATION SYSTEM');
  console.log('='.repeat(40));
  console.log('1. Create new user');
  console.log('2. Create new admin');
  console.log('3. View all users');
  console.log('4. View all admins');
  console.log('5. Exit');
  console.log('='.repeat(40));
};

// View users
const viewUsers = async () => {
  const users = await User.find({}).select('name email role phone address.city isActive createdAt');
  console.log('\n👥 ALL USERS');
  console.log('='.repeat(60));
  
  if (users.length === 0) {
    console.log('No users found');
    return;
  }
  
  users.forEach((user, index) => {
    console.log(`${index + 1}. ${user.name}`);
    console.log(`   📧 ${user.email} | 📱 ${user.phone}`);
    console.log(`   🎭 ${user.role} | 📍 ${user.address.city || 'N/A'}`);
    console.log(`   ✅ ${user.isActive ? 'Active' : 'Inactive'} | 📅 ${user.createdAt.toLocaleDateString()}`);
    console.log('');
  });
};

// View admins
const viewAdmins = async () => {
  const admins = await Admin.find({}).select('name username email role isActive createdAt');
  console.log('\n🔐 ALL ADMINS');
  console.log('='.repeat(60));
  
  if (admins.length === 0) {
    console.log('No admins found');
    return;
  }
  
  admins.forEach((admin, index) => {
    console.log(`${index + 1}. ${admin.name}`);
    console.log(`   🔑 ${admin.username} | 📧 ${admin.email}`);
    console.log(`   🛡️ ${admin.role} | ✅ ${admin.isActive ? 'Active' : 'Inactive'}`);
    console.log(`   📅 ${admin.createdAt.toLocaleDateString()}`);
    console.log('');
  });
};

// Main application
const runApp = async () => {
  await connectDB();
  
  console.log('🎉 WELCOME TO REAL USER CREATION SYSTEM');
  console.log('Create your actual users and admins for the SampoornaAngan system');
  
  while (true) {
    showMenu();
    const choice = await askQuestion('\nEnter your choice (1-5): ');
    
    try {
      switch (choice) {
        case '1':
          await createUser();
          break;
        case '2':
          await createAdmin();
          break;
        case '3':
          await viewUsers();
          break;
        case '4':
          await viewAdmins();
          break;
        case '5':
          console.log('👋 Thank you for using the user creation system!');
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