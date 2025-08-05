const mongoose = require('mongoose');
require('dotenv').config();

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

// Test login API directly
const testLogin = async () => {
  try {
    console.log('\n🧪 TESTING LOGIN API DIRECTLY');
    console.log('='.repeat(50));

    const testCases = [
      {
        name: 'Parent Login',
        email: 'parent@test.com',
        password: 'test123',
        role: 'parent'
      },
      {
        name: 'Adolescent Login',
        email: 'adolescent@test.com',
        password: 'test123',
        role: 'adolescent-girl'
      }
    ];

    for (const testCase of testCases) {
      console.log(`\n🔍 Testing: ${testCase.name}`);
      console.log('-'.repeat(30));
      
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
        
        console.log(`📊 Status: ${response.status}`);
        console.log(`✅ Success: ${data.success}`);
        console.log(`💬 Message: ${data.message}`);
        
        if (data.success) {
          console.log(`👤 User: ${data.data.user.name}`);
          console.log(`🎭 Role: ${data.data.user.role}`);
          console.log(`🏠 Dashboard: ${data.data.dashboard}`);
          console.log(`🔑 Auth Method: ${data.data.authMethod}`);
        } else {
          console.log(`❌ Error Details:`, data);
        }
        
      } catch (error) {
        console.log(`❌ Request Error: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing login:', error);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await testLogin();
  process.exit(0);
};

run();