const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
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

// Create sample CSV template
const createSampleCSV = () => {
  const sampleData = `name,email,phone,role,tempPassword,street,city,district,state,pincode,block,roleSpecificData
Priya Sharma,priya.sharma@gmail.com,9876543210,parent,priya123,123 Main St,Mumbai,Mumbai,Maharashtra,400001,Andheri,numberOfChildren:2;childrenAges:5,8
Rahul Kumar,rahul.kumar@gmail.com,9876543211,anganwadi-worker,rahul123,456 Park Ave,Delhi,Delhi,Delhi,110001,CP,centerName:AWC Delhi 1;centerCode:DL001;experience:5
Anita Singh,anita.singh@gmail.com,9876543212,adolescent-girl,anita123,789 School Rd,Pune,Pune,Maharashtra,411001,Kothrud,age:16;schoolName:Pune High School;grade:11
Sunita Devi,sunita.devi@gmail.com,9876543213,asha-volunteer,sunita123,321 Health St,Bangalore,Bangalore,Karnataka,560001,Koramangala,experience:3;area:Ward 5
Ravi Patel,ravi.patel@gmail.com,9876543214,sanitation-worker,ravi123,654 Clean Ave,Ahmedabad,Ahmedabad,Gujarat,380001,Navrangpura,area:Zone 1;shift:morning`;

  const csvPath = path.join(__dirname, 'sample_users.csv');
  fs.writeFileSync(csvPath, sampleData);
  console.log(`📄 Sample CSV created at: ${csvPath}`);
  return csvPath;
};

// Parse role-specific data
const parseRoleSpecificData = (dataString, role) => {
  if (!dataString) return {};
  
  const data = {};
  const pairs = dataString.split(';');
  
  pairs.forEach(pair => {
    const [key, value] = pair.split(':');
    if (key && value) {
      if (key === 'childrenAges') {
        data[key] = value.split(',').map(age => age.trim());
      } else {
        data[key] = value.trim();
      }
    }
  });
  
  return data;
};

// Validate user data
const validateUserData = (userData) => {
  const errors = [];
  
  // Required fields
  if (!userData.name || userData.name.trim().length < 2) {
    errors.push('Name is required and must be at least 2 characters');
  }
  
  if (!userData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    errors.push('Valid email is required');
  }
  
  if (!userData.phone || !/^[6-9]\d{9}$/.test(userData.phone)) {
    errors.push('Valid 10-digit phone number is required');
  }
  
  const validRoles = ['parent', 'adolescent-girl', 'anganwadi-worker', 'asha-volunteer', 'sanitation-worker'];
  if (!userData.role || !validRoles.includes(userData.role)) {
    errors.push('Valid role is required');
  }
  
  if (!userData.tempPassword || userData.tempPassword.length < 6) {
    errors.push('Temporary password must be at least 6 characters');
  }
  
  return errors;
};

// Import users from CSV
const importUsersFromCSV = async (csvFilePath) => {
  return new Promise((resolve, reject) => {
    const users = [];
    const errors = [];
    let lineNumber = 1;
    
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        lineNumber++;
        
        try {
          const userData = {
            name: row.name?.trim(),
            email: row.email?.trim().toLowerCase(),
            phone: row.phone?.trim(),
            role: row.role?.trim(),
            tempPassword: row.tempPassword?.trim(),
            address: {
              street: row.street?.trim() || '',
              city: row.city?.trim() || '',
              district: row.district?.trim() || '',
              state: row.state?.trim() || '',
              pincode: row.pincode?.trim() || '',
              block: row.block?.trim() || ''
            },
            roleSpecificData: parseRoleSpecificData(row.roleSpecificData, row.role?.trim())
          };
          
          // Validate data
          const validationErrors = validateUserData(userData);
          if (validationErrors.length > 0) {
            errors.push({
              line: lineNumber,
              email: userData.email,
              errors: validationErrors
            });
            return;
          }
          
          users.push(userData);
          
        } catch (error) {
          errors.push({
            line: lineNumber,
            email: row.email,
            errors: [`Parse error: ${error.message}`]
          });
        }
      })
      .on('end', () => {
        resolve({ users, errors });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

// Save users to database
const saveUsersToDatabase = async (users) => {
  const results = {
    success: [],
    failed: []
  };
  
  for (const userData of users) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      const existingAdmin = await Admin.findOne({ email: userData.email });
      
      if (existingUser || existingAdmin) {
        results.failed.push({
          email: userData.email,
          error: 'Email already exists'
        });
        continue;
      }
      
      // Create user object
      const user = new User({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        role: userData.role,
        tempPassword: userData.tempPassword,
        firebaseUid: `bulk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        address: userData.address,
        roleSpecificData: userData.roleSpecificData,
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
      });
      
      await user.save();
      results.success.push({
        name: user.name,
        email: user.email,
        role: user.role
      });
      
    } catch (error) {
      results.failed.push({
        email: userData.email,
        error: error.message
      });
    }
  }
  
  return results;
};

// Main bulk import function
const runBulkImport = async () => {
  try {
    await connectDB();
    
    console.log('📥 BULK USER IMPORT SYSTEM');
    console.log('='.repeat(50));
    
    // Check if CSV file exists
    const csvPath = path.join(__dirname, 'users.csv');
    
    if (!fs.existsSync(csvPath)) {
      console.log('❌ CSV file not found. Creating sample CSV...');
      const samplePath = createSampleCSV();
      console.log('\n📋 INSTRUCTIONS:');
      console.log('1. Edit the sample_users.csv file with your real data');
      console.log('2. Rename it to users.csv');
      console.log('3. Run this script again');
      console.log('\n📄 CSV Format:');
      console.log('name,email,phone,role,tempPassword,street,city,district,state,pincode,block,roleSpecificData');
      console.log('\n🎭 Valid Roles:');
      console.log('- parent');
      console.log('- adolescent-girl');
      console.log('- anganwadi-worker');
      console.log('- asha-volunteer');
      console.log('- sanitation-worker');
      console.log('\n📝 Role-Specific Data Format:');
      console.log('Use semicolon (;) to separate fields and colon (:) for key-value pairs');
      console.log('Example: numberOfChildren:2;childrenAges:5,8');
      return;
    }
    
    console.log('📄 Reading CSV file...');
    const { users, errors } = await importUsersFromCSV(csvPath);
    
    console.log(`\n📊 VALIDATION RESULTS:`);
    console.log(`✅ Valid users: ${users.length}`);
    console.log(`❌ Invalid entries: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('\n❌ VALIDATION ERRORS:');
      errors.forEach(error => {
        console.log(`Line ${error.line} (${error.email}):`);
        error.errors.forEach(err => console.log(`   - ${err}`));
      });
    }
    
    if (users.length === 0) {
      console.log('\n❌ No valid users to import. Please fix the errors and try again.');
      return;
    }
    
    console.log('\n💾 Saving users to database...');
    const results = await saveUsersToDatabase(users);
    
    console.log('\n🎉 IMPORT COMPLETED!');
    console.log('='.repeat(50));
    console.log(`✅ Successfully imported: ${results.success.length} users`);
    console.log(`❌ Failed to import: ${results.failed.length} users`);
    
    if (results.success.length > 0) {
      console.log('\n✅ SUCCESSFULLY IMPORTED USERS:');
      results.success.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ FAILED IMPORTS:');
      results.failed.forEach((failure, index) => {
        console.log(`${index + 1}. ${failure.email} - ${failure.error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Bulk import error:', error);
  } finally {
    process.exit(0);
  }
};

// Install csv-parser if not installed
const checkDependencies = () => {
  try {
    require('csv-parser');
  } catch (error) {
    console.log('📦 Installing csv-parser dependency...');
    const { execSync } = require('child_process');
    execSync('npm install csv-parser', { stdio: 'inherit' });
    console.log('✅ csv-parser installed successfully');
  }
};

// Run the import
checkDependencies();
runBulkImport();