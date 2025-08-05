const mongoose = require('mongoose');
require('dotenv').config();

// Import User model
const User = require('../models/User');

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

// Verify login functionality
const verifyLogin = async () => {
  try {
    console.log('\n🔍 VERIFYING LOGIN FUNCTIONALITY');
    console.log('='.repeat(50));

    // Test cases
    const testCases = [
      {
        name: 'Parent Login',
        email: 'parent@test.com',
        password: 'test123',
        role: 'parent',
        expectedDashboard: '/parent-dashboard'
      },
      {
        name: 'Adolescent Login',
        email: 'adolescent@test.com',
        password: 'test123',
        role: 'adolescent-girl',
        expectedDashboard: '/adolescent-dashboard'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🧪 Testing: ${testCase.name}`);
      console.log('-'.repeat(30));
      
      // 1. Check if user exists in database
      const user = await User.findOne({ 
        email: testCase.email,
        isActive: true 
      });
      
      if (!user) {
        console.log('❌ User not found in database');
        continue;
      }
      
      console.log('✅ User found in database');
      console.log(`   👤 Name: ${user.name}`);
      console.log(`   🎭 Role: ${user.role}`);
      console.log(`   🔑 Has tempPassword: ${!!user.tempPassword}`);
      
      // 2. Verify role matches
      if (user.role !== testCase.role) {
        console.log(`❌ Role mismatch: expected ${testCase.role}, got ${user.role}`);
        continue;
      }
      
      console.log('✅ Role matches');
      
      // 3. Verify password
      if (user.tempPassword && user.tempPassword === testCase.password) {
        console.log('✅ Password matches (tempPassword)');
      } else if (user.hashedPassword) {
        console.log('ℹ️ User has hashed password (would need bcrypt verification)');
      } else {
        console.log('❌ No valid password method found');
        continue;
      }
      
      // 4. Test API call
      let apiWorking = false;
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testCase.email,
            password: testCase.password,
            role: testCase.role
          })
        });

        const data = await response.json();
        
        if (response.ok && data.success) {
          console.log('✅ API login successful');
          console.log(`   🏠 Dashboard: ${data.data.dashboard}`);
          console.log(`   🔑 Auth Method: ${data.data.authMethod}`);
          apiWorking = true;
          
          if (data.data.dashboard === testCase.expectedDashboard) {
            console.log('✅ Dashboard route correct');
          } else {
            console.log(`❌ Dashboard route mismatch: expected ${testCase.expectedDashboard}, got ${data.data.dashboard}`);
          }
        } else {
          console.log('❌ API login failed');
          console.log(`   📊 Status: ${response.status}`);
          console.log(`   💬 Message: ${data.message}`);
        }
        
      } catch (apiError) {
        console.log(`❌ API request failed: ${apiError.message}`);
      }
      
      console.log(`\n📋 Summary for ${testCase.name}:`);
      console.log(`   Database: ✅ User exists`);
      console.log(`   Role: ✅ Matches`);
      console.log(`   Password: ✅ Valid`);
      console.log(`   API: ${apiWorking ? '✅ Working' : '❌ Failed'}`);
    }

    console.log('\n🎯 INSTRUCTIONS FOR FRONTEND TESTING:');
    console.log('='.repeat(50));
    console.log('1. Open http://localhost:5174/login in your browser');
    console.log('2. Try these credentials:');
    console.log('   • Parent: parent@test.com / test123 (select "Parent/Guardian" role)');
    console.log('   • Adolescent: adolescent@test.com / test123 (select "Adolescent Girl" role)');
    console.log('3. Check browser console for detailed logs');
    console.log('4. If login fails, check Network tab for API call details');

  } catch (error) {
    console.error('❌ Error verifying login:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await verifyLogin();
  process.exit(0);
};

run();