const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Admin = require('../models/Admin');
const User = require('../models/User');

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    process.exit(1);
  }
};

// Create default admin
const createDefaultAdmin = async () => {
  try {
    console.log('🔧 Creating default admin...');
    
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    if (existingAdmin) {
      console.log('ℹ️  Default admin already exists');
      return existingAdmin;
    }
    
    const defaultAdmin = new Admin({
      username: process.env.ADMIN_USERNAME || 'admin',
      email: process.env.ADMIN_EMAIL || 'admin@sampoornaangan.gov.in',
      password: process.env.ADMIN_PASSWORD || 'admin',
      name: 'Super Administrator',
      role: 'super-admin',
      isVerified: true,
      isActive: true,
      jurisdiction: {
        state: 'Maharashtra',
        district: 'All Districts',
        block: 'All Blocks',
        panchayat: 'All Panchayats',
      },
    });
    
    await defaultAdmin.save();
    console.log('✅ Default admin created successfully');
    console.log(`📧 Email: ${defaultAdmin.email}`);
    console.log(`👤 Username: ${defaultAdmin.username}`);
    console.log(`🔑 Password: ${process.env.ADMIN_PASSWORD || 'admin'}`);
    
    return defaultAdmin;
  } catch (error) {
    console.error('❌ Error creating default admin:', error);
    throw error;
  }
};

// Create database indexes
const createIndexes = async () => {
  try {
    console.log('🔧 Creating database indexes...');
    
    // User indexes
    await User.createIndexes();
    console.log('✅ User indexes created');
    
    // Admin indexes
    await Admin.createIndexes();
    console.log('✅ Admin indexes created');
    
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
    throw error;
  }
};

// Seed sample data (optional)
const seedSampleData = async () => {
  try {
    console.log('🌱 Seeding sample data...');
    
    // Check if sample data already exists
    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      console.log('ℹ️  Sample data already exists');
      return;
    }
    
    // Sample users data
    const sampleUsers = [
      {
        firebaseUid: 'sample-aww-1',
        name: 'Priya Sharma',
        email: 'priya.aww@example.com',
        phone: '9876543210',
        role: 'anganwadi-worker',
        address: {
          street: 'Main Road',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411001',
          district: 'Pune',
          block: 'Pune East',
        },
        roleSpecificData: {
          anganwadiCenter: {
            name: 'Anganwadi Center - Pune East',
            code: 'AWC-PE-001',
            location: 'Sector 15, Pune East',
          },
        },
        isActive: true,
        isVerified: true,
      },
      {
        firebaseUid: 'sample-asha-1',
        name: 'Sunita Devi',
        email: 'sunita.asha@example.com',
        phone: '9876543211',
        role: 'asha-volunteer',
        address: {
          street: 'Village Road',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          district: 'Mumbai',
          block: 'Mumbai North',
        },
        roleSpecificData: {
          ashaDetails: {
            certificationNumber: 'ASHA-MH-2023-001',
            trainingCompleted: true,
            serviceArea: 'Mumbai North Block',
          },
        },
        isActive: true,
        isVerified: true,
      },
      {
        firebaseUid: 'sample-parent-1',
        name: 'Rajesh Kumar',
        email: 'rajesh.parent@example.com',
        phone: '9876543212',
        role: 'parent',
        address: {
          street: 'Housing Society',
          city: 'Nashik',
          state: 'Maharashtra',
          pincode: '422001',
          district: 'Nashik',
          block: 'Nashik Rural',
        },
        roleSpecificData: {
          parentDetails: {
            children: [
              {
                name: 'Aarav Kumar',
                age: 3,
                gender: 'Male',
                anganwadiCenter: 'AWC-NR-001',
              },
              {
                name: 'Priya Kumar',
                age: 5,
                gender: 'Female',
                anganwadiCenter: 'AWC-NR-001',
              },
            ],
            occupation: 'Farmer',
            familySize: 4,
          },
        },
        isActive: true,
        isVerified: true,
      },
    ];
    
    // Insert sample users (Note: In real implementation, these would be created through Firebase)
    // await User.insertMany(sampleUsers);
    // console.log('✅ Sample users created');
    
    console.log('ℹ️  Sample data seeding skipped (Firebase users need to be created through registration)');
    
  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
    throw error;
  }
};

// Main setup function
const setup = async () => {
  try {
    console.log('🚀 Starting SampoornaAngan Backend Setup...\n');
    
    // Connect to database
    await connectDB();
    
    // Create indexes
    await createIndexes();
    
    // Create default admin
    await createDefaultAdmin();
    
    // Seed sample data (optional)
    if (process.argv.includes('--seed')) {
      await seedSampleData();
    }
    
    console.log('\n✅ Setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Set up Firebase project and update .env file');
    console.log('2. Start the server: npm run dev');
    console.log('3. Test admin login with the credentials above');
    console.log('4. Register users through the frontend application');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
    process.exit(0);
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setup();
}

module.exports = {
  setup,
  createDefaultAdmin,
  createIndexes,
  seedSampleData,
};