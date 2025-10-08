const axios = require('axios');

const API_BASE_URL = 'http://localhost:5005/api';

async function simulateFrontendFlow() {
  try {
    console.log('🧪 Simulating Frontend Parent Dashboard Flow...');
    console.log('='.repeat(60));

    // Step 1: Login (simulate what authService.loginUser does)
    console.log('🔐 Step 1: Login with direct credentials...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'lekha.parent@test.com',
      password: 'testparent123',
      role: 'parent'
    });

    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    console.log('✅ Login successful!');
    console.log(`   User: ${loginResponse.data.data.user.name}`);
    console.log(`   Role: ${loginResponse.data.data.role}`);
    console.log(`   Auth Token: ${loginResponse.data.data.token ? 'Present' : 'Missing'}`);

    const token = loginResponse.data.data.token;

    // Step 2: Get children data (simulate what parentService.getMyChildren does)
    console.log('\n📊 Step 2: Fetching children data...');
    const childrenResponse = await axios.get(`${API_BASE_URL}/registration/my-children`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!childrenResponse.data.success) {
      throw new Error(`Children API failed: ${childrenResponse.data.message}`);
    }

    console.log('✅ Children data retrieved successfully!');
    const apiChildren = childrenResponse.data.data.children;
    console.log(`   Found: ${apiChildren.length} children`);

    // Step 3: Simulate parentService.getParentStats() processing
    console.log('\n⚙️  Step 3: Processing data (simulating parentService.getParentStats)...');
    
    // This is exactly what our updated parentService does:
    const processedChildren = apiChildren.map(child => ({
      id: child._id || child.id,
      name: child.name || 'Unknown',
      age: child.ageDisplay || child.age || 'Unknown',
      healthStatus: child.healthStatus || 'pending',
      vaccinationStatus: child.vaccinationStatus || 'pending',
      nutritionStatus: child.nutritionStatus || 'normal',
      anganwadiCenter: child.anganwadiCenter || 'Not assigned',
      lastCheckup: child.updatedAt || new Date(),
      nextCheckup: child.nextCheckup || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      // OUR FIX: Add missing database fields
      dateOfBirth: child.dateOfBirth,
      bloodGroup: child.bloodGroup,
      enrollmentDate: child.enrollmentDate
    }));

    console.log('✅ Data processing complete!');

    // Step 4: Display results (what ChildDetailsCard would receive)
    console.log('\n👶 Step 4: Final data for ChildDetailsCard component:');
    console.log('='.repeat(60));

    processedChildren.forEach((child, index) => {
      console.log(`\n${index + 1}. ${child.name}`);
      console.log(`   🗓️  Date of Birth: ${child.dateOfBirth ? new Date(child.dateOfBirth).toLocaleDateString() : '❌ MISSING - will show "Not scheduled"'}`);
      console.log(`   🩸  Blood Group: ${child.bloodGroup || '❌ MISSING - will show "Not recorded"'}`);
      console.log(`   📅  Enrollment Date: ${child.enrollmentDate ? new Date(child.enrollmentDate).toLocaleDateString() : '❌ MISSING - will show "Not scheduled"'}`);
      console.log(`   🏥  Health Status: ${child.healthStatus}`);
      console.log(`   💉  Vaccination Status: ${child.vaccinationStatus}`);
      console.log(`   🏢  Anganwadi Center: ${child.anganwadiCenter}`);
    });

    // Step 5: Verify the fix worked
    console.log('\n🔍 Step 5: Verifying fix effectiveness...');
    console.log('='.repeat(40));

    const hasDateOfBirth = processedChildren.every(child => child.dateOfBirth);
    const hasBloodGroup = processedChildren.every(child => child.bloodGroup);
    const hasEnrollmentDate = processedChildren.every(child => child.enrollmentDate);

    console.log(`${hasDateOfBirth ? '✅' : '❌'} Date of Birth: ${hasDateOfBirth ? 'ALL CHILDREN HAVE DATA' : 'SOME MISSING'}`);
    console.log(`${hasBloodGroup ? '✅' : '❌'} Blood Group: ${hasBloodGroup ? 'ALL CHILDREN HAVE DATA' : 'SOME MISSING'}`);
    console.log(`${hasEnrollmentDate ? '✅' : '❌'} Enrollment Date: ${hasEnrollmentDate ? 'ALL CHILDREN HAVE DATA' : 'SOME MISSING'}`);

    if (hasDateOfBirth && hasBloodGroup && hasEnrollmentDate) {
      console.log('\n🎉 SUCCESS: Fix is working! Child data is now complete.');
      console.log('   The Parent Dashboard should now show all required information.');
    } else {
      console.log('\n⚠️  WARNING: Fix incomplete - some data still missing.');
      
      // Debug: Show raw API data
      console.log('\n🔍 Debug: Raw API response for first child:');
      if (apiChildren.length > 0) {
        const rawChild = apiChildren[0];
        console.log('   dateOfBirth:', rawChild.dateOfBirth);
        console.log('   bloodGroup:', rawChild.bloodGroup);
        console.log('   enrollmentDate:', rawChild.enrollmentDate);
        console.log('   Full object keys:', Object.keys(rawChild));
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', error.response.data);
    }
  }
}

// Run the simulation
simulateFrontendFlow();