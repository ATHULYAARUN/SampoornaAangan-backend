const mongoose = require('mongoose');
const Child = require('./models/Child');
require('dotenv').config();

async function updateAkhilAge() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('✅ Connected to MongoDB');
    
    // Calculate birth dates for accurate ages
    const today = new Date();
    const akhilBirthDate = new Date(today.getFullYear() - 5, today.getMonth(), today.getDate()); // 5 years old
    const athulyaBirthDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate()); // 3 years old
    
    console.log(`📅 Akhil's new birth date: ${akhilBirthDate.toDateString()} (5 years old)`);
    console.log(`📅 Athulya's birth date: ${athulyaBirthDate.toDateString()} (3 years old)`);
    
    // Check if children already exist
    const existingAkhil = await Child.findOne({ name: 'Akhil' });
    const existingAthulya = await Child.findOne({ name: 'Athulya' });
    
    // Sample parent data (using test credentials)
    const parentData = {
      parentName: 'Rama Krishna',
      parentPhone: '9876543210',
      parentEmail: 'parent@test.com',
      relationToChild: 'father',
      anganwadiCenter: 'Akkarakunnu Anganwadi',
      address: {
        street: 'Anganwadi Street',
        village: 'Akkarakunnu',
        block: 'Kasaragod',
        district: 'Kasaragod',
        state: 'Kerala',
        pincode: '671121'
      }
    };
    
    // Create or update Akhil (5 years old)
    if (existingAkhil) {
      console.log('📝 Updating existing Akhil record...');
      await Child.findByIdAndUpdate(existingAkhil._id, {
        dateOfBirth: akhilBirthDate,
        age: 5,
        currentWeight: 16.5, // Age-appropriate weight for 5-year-old
        currentHeight: 105,  // Age-appropriate height for 5-year-old
        updatedAt: new Date()
      });
      console.log('✅ Akhil updated successfully - now 5 years old');
    } else {
      console.log('➕ Creating new Akhil record...');
      const newAkhil = new Child({
        name: 'Akhil',
        dateOfBirth: akhilBirthDate,
        age: 5,
        gender: 'male',
        ...parentData,
        birthWeight: 3.2,
        currentWeight: 16.5,
        currentHeight: 105,
        bloodGroup: 'O+',
        nutritionStatus: 'normal',
        vaccinations: [
          { vaccineName: 'BCG', dateGiven: new Date('2020-01-15'), givenBy: 'Dr. Priya' },
          { vaccineName: 'DPT 1', dateGiven: new Date('2020-03-10'), givenBy: 'Nurse Sarah' },
          { vaccineName: 'DPT 2', dateGiven: new Date('2020-05-10'), givenBy: 'Nurse Sarah' },
          { vaccineName: 'DPT 3', dateGiven: new Date('2020-07-10'), givenBy: 'Nurse Sarah' },
          { vaccineName: 'OPV 1', dateGiven: new Date('2020-03-10'), givenBy: 'Nurse Sarah' },
          { vaccineName: 'OPV 2', dateGiven: new Date('2020-05-10'), givenBy: 'Nurse Sarah' },
          { vaccineName: 'OPV 3', dateGiven: new Date('2020-07-10'), givenBy: 'Nurse Sarah' },
          { vaccineName: 'MMR 1', dateGiven: new Date('2021-01-15'), givenBy: 'Dr. Ravi' }
        ]
      });
      await newAkhil.save();
      console.log('✅ Akhil created successfully - 5 years old');
    }
    
    // Create or update Athulya (3 years old) for consistency
    if (existingAthulya) {
      console.log('📝 Updating existing Athulya record...');
      await Child.findByIdAndUpdate(existingAthulya._id, {
        dateOfBirth: athulyaBirthDate,
        age: 3,
        currentWeight: 14.8,
        currentHeight: 92,
        updatedAt: new Date()
      });
      console.log('✅ Athulya updated successfully - 3 years old');
    } else {
      console.log('➕ Creating new Athulya record...');
      const newAthulya = new Child({
        name: 'Athulya',
        dateOfBirth: athulyaBirthDate,
        age: 3,
        gender: 'female',
        ...parentData,
        relationToChild: 'father',
        birthWeight: 3.0,
        currentWeight: 14.8,
        currentHeight: 92,
        bloodGroup: 'A+',
        nutritionStatus: 'normal',
        specialNeeds: 'Mild hearing difficulty',
        vaccinations: [
          { vaccineName: 'BCG', dateGiven: new Date('2021-06-20'), givenBy: 'Dr. Ravi' },
          { vaccineName: 'DPT 1', dateGiven: new Date('2021-08-15'), givenBy: 'Nurse Meera' },
          { vaccineName: 'DPT 2', dateGiven: new Date('2021-10-10'), givenBy: 'Nurse Meera' },
          { vaccineName: 'MMR 1', dateGiven: new Date('2022-03-20'), givenBy: 'Dr. Ravi' }
        ]
      });
      await newAthulya.save();
      console.log('✅ Athulya created successfully - 3 years old');
    }
    
    // Verify the updates
    console.log('\n🔍 Verification:');
    const updatedAkhil = await Child.findOne({ name: 'Akhil' });
    const updatedAthulya = await Child.findOne({ name: 'Athulya' });
    
    if (updatedAkhil) {
      const akhilAge = Math.floor((new Date() - updatedAkhil.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
      console.log(`👦 Akhil: Born ${updatedAkhil.dateOfBirth.toDateString()}, Age: ${akhilAge} years, Weight: ${updatedAkhil.currentWeight}kg, Height: ${updatedAkhil.currentHeight}cm`);
    }
    
    if (updatedAthulya) {
      const athulyaAge = Math.floor((new Date() - updatedAthulya.dateOfBirth) / (365.25 * 24 * 60 * 60 * 1000));
      console.log(`👧 Athulya: Born ${updatedAthulya.dateOfBirth.toDateString()}, Age: ${athulyaAge} years, Weight: ${updatedAthulya.currentWeight}kg, Height: ${updatedAthulya.currentHeight}cm`);
    }
    
  } catch (error) {
    console.error('❌ Error updating children data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Database connection closed');
  }
}

// Run the update
console.log('🚀 Starting Akhil age update process...\n');
updateAkhilAge();