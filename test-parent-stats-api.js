const axios = require('axios');

const API_BASE_URL = 'http://localhost:5005/api';

async function testParentStatsAPI() {
  try {
    console.log('🧪 Testing Parent Stats API...');
    console.log('='.repeat(50));

    // Step 1: Login to get auth token
    console.log('🔐 Step 1: Authenticating parent...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'lekha.parent@test.com',
      password: 'testparent123',
      role: 'parent'
    });

    if (loginResponse.data.success) {
      console.log('✅ Authentication successful');
      const token = loginResponse.data.token;

      // Step 2: Get my children (correct endpoint)
      console.log('\n📊 Step 2: Fetching my children...');
      const statsResponse = await axios.get(`${API_BASE_URL}/registration/my-children`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.data.success) {
        console.log('✅ My children data retrieved successfully');
        
        const children = statsResponse.data.data.children;
        console.log(`\n👶 Found ${children.length} children:`);
        console.log('='.repeat(60));

        children.forEach((child, index) => {
          console.log(`\n${index + 1}. ${child.name}`);
          console.log(`   🗓️  Date of Birth: ${child.dateOfBirth || '❌ MISSING'}`);
          console.log(`   🩸  Blood Group: ${child.bloodGroup || '❌ MISSING'}`);
          console.log(`   📅  Enrollment Date: ${child.enrollmentDate || '❌ MISSING'}`);
          console.log(`   🏥  Health Status: ${child.healthStatus}`);
          console.log(`   🏢  Anganwadi Center: ${child.anganwadiCenter}`);
        });

        // Check if fix worked
        const hasDateOfBirth = children.some(child => child.dateOfBirth);
        const hasBloodGroup = children.some(child => child.bloodGroup);
        const hasEnrollmentDate = children.some(child => child.enrollmentDate);

        console.log('\n🔍 API Fix Status:');
        console.log('='.repeat(30));
        console.log(`${hasDateOfBirth ? '✅' : '❌'} Date of Birth: ${hasDateOfBirth ? 'WORKING' : 'STILL MISSING'}`);
        console.log(`${hasBloodGroup ? '✅' : '❌'} Blood Group: ${hasBloodGroup ? 'WORKING' : 'STILL MISSING'}`);
        console.log(`${hasEnrollmentDate ? '✅' : '❌'} Enrollment Date: ${hasEnrollmentDate ? 'WORKING' : 'STILL MISSING'}`);

        if (hasDateOfBirth && hasBloodGroup && hasEnrollmentDate) {
          console.log('\n🎉 SUCCESS: Parent Service API is now returning complete child data!');
        } else {
          console.log('\n⚠️  WARNING: Parent Service API still missing some data');
          console.log('\n🔍 Raw child data for debugging:');
          console.log(JSON.stringify(children, null, 2));
        }

      } else {
        console.log('❌ Failed to get parent stats:', statsResponse.data.message);
      }

    } else {
      console.log('❌ Authentication failed:', loginResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testParentStatsAPI();