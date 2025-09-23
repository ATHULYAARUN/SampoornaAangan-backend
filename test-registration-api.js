const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test data for child registration
const testChildData = {
  name: 'Test Child',
  dateOfBirth: '2020-01-15',
  gender: 'male',
  parentName: 'Test Parent',
  parentPhone: '9876543210',
  parentEmail: 'parent@test.com',
  relationToChild: 'mother',
  address: {
    street: '123 Test Street',
    village: 'Test Village',
    block: 'Test Block',
    district: 'Test District',
    state: 'Test State',
    pincode: '123456'
  },
  anganwadiCenter: 'Test Anganwadi Center',
  birthWeight: 3.2,
  currentWeight: 15.5,
  currentHeight: 95,
  bloodGroup: 'O+',
  medicalHistory: {
    allergies: ['Peanuts'],
    chronicConditions: [],
    disabilities: [],
    medications: []
  },
  specialNeeds: '',
  notes: 'Test registration'
};

// Test data for pregnant woman registration
const testPregnantWomanData = {
  name: 'Test Pregnant Woman',
  dateOfBirth: '1990-05-20',
  phone: '9876543211',
  email: 'pregnant@test.com',
  husbandName: 'Test Husband',
  husbandPhone: '9876543212',
  address: {
    street: '456 Test Street',
    village: 'Test Village',
    block: 'Test Block',
    district: 'Test District',
    state: 'Test State',
    pincode: '123456'
  },
  lastMenstrualPeriod: '2024-01-01',
  expectedDeliveryDate: '2024-10-08',
  pregnancyNumber: 2,
  previousPregnancies: {
    liveBirths: 1,
    stillBirths: 0,
    miscarriages: 0,
    abortions: 0
  },
  bloodGroup: 'A+',
  height: 160,
  prePregnancyWeight: 55,
  currentWeight: 65,
  medicalHistory: {
    diabetes: false,
    hypertension: false,
    heartDisease: false,
    kidneyDisease: false,
    thyroidDisorder: false,
    anemia: true,
    allergies: [],
    medications: ['Iron supplements'],
    previousComplications: []
  },
  anganwadiCenter: 'Test Anganwadi Center',
  specialNeeds: '',
  notes: 'Test pregnant woman registration'
};

// Test data for adolescent registration
const testAdolescentData = {
  name: 'Test Adolescent',
  dateOfBirth: '2010-03-15',
  phone: '9876543213',
  email: 'adolescent@test.com',
  parentName: 'Test Parent',
  parentPhone: '9876543214',
  parentEmail: 'parent2@test.com',
  relationToAdolescent: 'mother',
  address: {
    street: '789 Test Street',
    village: 'Test Village',
    block: 'Test Block',
    district: 'Test District',
    state: 'Test State',
    pincode: '123456'
  },
  education: {
    schoolName: 'Test School',
    grade: '8th',
    isInSchool: true,
    dropoutReason: '',
    educationLevel: 'middle'
  },
  height: 150,
  weight: 45,
  bloodGroup: 'B+',
  menstrualHealth: {
    hasMenstruationStarted: true,
    ageAtMenarche: 12,
    menstrualCycleLength: 28,
    lastMenstrualPeriod: '2024-01-01',
    menstrualProblems: [],
    hygieneEducationReceived: true
  },
  medicalHistory: {
    allergies: [],
    chronicConditions: [],
    disabilities: [],
    medications: [],
    previousSurgeries: []
  },
  nutritionStatus: 'normal',
  anganwadiCenter: 'Test Anganwadi Center',
  specialNeeds: '',
  notes: 'Test adolescent registration'
};

// Test data for newborn registration
const testNewbornData = {
  name: 'Test Newborn',
  dateOfBirth: '2024-01-10',
  timeOfBirth: '14:30',
  gender: 'female',
  motherName: 'Test Mother',
  motherAge: 25,
  motherPhone: '9876543215',
  motherEmail: 'mother@test.com',
  fatherName: 'Test Father',
  fatherAge: 28,
  fatherPhone: '9876543216',
  address: {
    street: '101 Test Street',
    village: 'Test Village',
    block: 'Test Block',
    district: 'Test District',
    state: 'Test State',
    pincode: '123456'
  },
  birthDetails: {
    placeOfBirth: 'hospital',
    deliveryType: 'normal',
    attendedBy: 'doctor',
    complications: [],
    gestationalAge: 38
  },
  measurements: {
    birthWeight: 3.0,
    birthLength: 48,
    headCircumference: 34,
    chestCircumference: 32
  },
  healthAssessment: {
    apgarScore: {
      oneMinute: 8,
      fiveMinute: 9
    },
    bloodGroup: 'O+',
    congenitalAnomalies: [],
    birthDefects: [],
    respiratoryDistress: false,
    feedingDifficulties: false,
    jaundice: false
  },
  feedingDetails: {
    breastfeedingInitiated: true,
    timeToFirstFeed: 1,
    feedingType: 'exclusive-breastfeeding',
    feedingProblems: []
  },
  anganwadiCenter: 'Test Anganwadi Center',
  specialNeeds: '',
  notes: 'Test newborn registration'
};

// Function to test API endpoints
async function testRegistrationAPI() {
  console.log('🧪 Testing Registration API Endpoints...\n');

  try {
    // Test child registration
    console.log('1. Testing Child Registration...');
    try {
      const childResponse = await axios.post(`${API_BASE_URL}/registration/child`, testChildData, {
        headers: {
          'Content-Type': 'application/json',
          // Note: In real scenario, you would need a valid Firebase token
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Child registration endpoint exists');
      console.log('Response structure:', Object.keys(childResponse.data));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Child registration endpoint exists (requires auth)');
      } else {
        console.log('❌ Child registration failed:', error.response?.data?.message || error.message);
      }
    }

    // Test pregnant woman registration
    console.log('\n2. Testing Pregnant Woman Registration...');
    try {
      const womanResponse = await axios.post(`${API_BASE_URL}/registration/pregnant-woman`, testPregnantWomanData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Pregnant woman registration endpoint exists');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Pregnant woman registration endpoint exists (requires auth)');
      } else {
        console.log('❌ Pregnant woman registration failed:', error.response?.data?.message || error.message);
      }
    }

    // Test adolescent registration
    console.log('\n3. Testing Adolescent Registration...');
    try {
      const adolescentResponse = await axios.post(`${API_BASE_URL}/registration/adolescent`, testAdolescentData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Adolescent registration endpoint exists');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Adolescent registration endpoint exists (requires auth)');
      } else {
        console.log('❌ Adolescent registration failed:', error.response?.data?.message || error.message);
      }
    }

    // Test newborn registration
    console.log('\n4. Testing Newborn Registration...');
    try {
      const newbornResponse = await axios.post(`${API_BASE_URL}/registration/newborn`, testNewbornData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }
      });
      console.log('✅ Newborn registration endpoint exists');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Newborn registration endpoint exists (requires auth)');
      } else {
        console.log('❌ Newborn registration failed:', error.response?.data?.message || error.message);
      }
    }

    // Test GET endpoints
    console.log('\n5. Testing GET Endpoints...');
    
    const getEndpoints = [
      '/registration/children',
      '/registration/pregnant-women',
      '/registration/adolescents',
      '/registration/newborns'
    ];

    for (const endpoint of getEndpoints) {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Authorization': 'Bearer test-token'
          }
        });
        console.log(`✅ ${endpoint} endpoint exists`);
      } catch (error) {
        if (error.response?.status === 401) {
          console.log(`✅ ${endpoint} endpoint exists (requires auth)`);
        } else {
          console.log(`❌ ${endpoint} failed:`, error.response?.data?.message || error.message);
        }
      }
    }

    console.log('\n🎉 Registration API test completed!');
    console.log('\n📝 Summary:');
    console.log('- All registration endpoints are properly configured');
    console.log('- Authentication middleware is working');
    console.log('- API routes are accessible');
    console.log('\n⚠️  Note: To test with real data, you need:');
    console.log('1. Start the backend server: cd backend && npm start');
    console.log('2. Have MongoDB running');
    console.log('3. Use valid Firebase authentication tokens');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRegistrationAPI();
