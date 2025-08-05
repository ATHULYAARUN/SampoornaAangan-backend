const axios = require('axios');



const testLogin = async (email) => {
  try {
    console.log('\n🧪 Testing Login API...');
    
    const loginData = {
      email: email,
      password: 'password123',
      role: 'parent'
    };
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData);
    
    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.error('❌ Login failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
};

// Run tests
const runTests = async () => {
  const testUser = {
    name: 'Fresh Test User',
    email: `fresh${Date.now()}@example.com`,
    password: 'password123',
    phone: '9876543210',
    role: 'parent',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
      district: 'Test District',
      block: 'Test Block'
    },
    roleSpecificData: {
      parentDetails: {
        children: [{
          name: 'Test Child',
          age: 5,
          gender: 'Male'
        }],
        familySize: 3
      }
    }
  };
  
  console.log('🧪 Testing Registration API...');
  try {
    const response = await axios.post('http://localhost:5000/api/auth/register', testUser);
    console.log('✅ Registration successful!');
    console.log('Response:', response.data);
  } catch (error) {
    console.error('❌ Registration failed:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
  await testLogin(testUser.email);
};

runTests();