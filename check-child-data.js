const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Child = require('./models/Child');

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

const checkChildrenData = async () => {
  try {
    await connectDB();

    console.log('🔍 Checking children data for parent: lekha.parent@test.com');
    
    // Find children for test parent
    const children = await Child.find({
      $or: [
        { parentEmail: 'lekha.parent@test.com' },
        { parentPhone: '9876543210' }
      ]
    });

    console.log(`\n📊 Found ${children.length} children:`);
    console.log('='.repeat(60));

    children.forEach((child, index) => {
      console.log(`\n👶 Child ${index + 1}: ${child.name}`);
      console.log(`   🗓️  Date of Birth: ${child.dateOfBirth ? child.dateOfBirth.toISOString().split('T')[0] : '❌ MISSING'}`);
      console.log(`   🩸  Blood Group: ${child.bloodGroup || '❌ MISSING'}`);
      console.log(`   📅  Enrollment Date: ${child.enrollmentDate ? child.enrollmentDate.toISOString().split('T')[0] : '❌ MISSING'}`);
      console.log(`   🏥  Nutrition Status: ${child.nutritionStatus || 'Not set'}`);
      console.log(`   🏢  Anganwadi Center: ${child.anganwadiCenter || 'Not assigned'}`);
      console.log(`   📱  Parent Phone: ${child.parentPhone}`);
      console.log(`   📧  Parent Email: ${child.parentEmail || 'Not provided'}`);
    });

    // Check data completeness
    const hasDateOfBirth = children.filter(c => c.dateOfBirth).length;
    const hasBloodGroup = children.filter(c => c.bloodGroup).length;
    const hasEnrollmentDate = children.filter(c => c.enrollmentDate).length;

    console.log('\n🔍 Data Completeness Check:');
    console.log('='.repeat(30));
    console.log(`✅ Date of Birth: ${hasDateOfBirth}/${children.length} children`);
    console.log(`✅ Blood Group: ${hasBloodGroup}/${children.length} children`);
    console.log(`✅ Enrollment Date: ${hasEnrollmentDate}/${children.length} children`);

    if (hasDateOfBirth === children.length && hasBloodGroup === children.length && hasEnrollmentDate === children.length) {
      console.log('\n🎉 SUCCESS: All children have complete data!');
    } else {
      console.log('\n⚠️  WARNING: Some children are missing required data fields');
    }

  } catch (error) {
    console.error('❌ Error checking children data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 MongoDB disconnected');
  }
};

// Run the check
checkChildrenData();