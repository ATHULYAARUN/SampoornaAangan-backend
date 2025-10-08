const mongoose = require('mongoose');
const Child = require('./models/Child');

async function addHealthDataToChildren() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sampoornaangan');
    console.log('Connected to MongoDB');
    
    const children = await Child.find({ anganwadiCenter: 'Akkarakunnu Anganwadi' });
    console.log(`Found ${children.length} children to update health data`);
    
    // Sample health data for the children
    const healthDataUpdates = [
      {
        name: 'Akhil',
        currentWeight: 16.5, // Updated for 5-year-old
        currentHeight: 105,   // Updated for 5-year-old
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
      },
      {
        name: 'Athulya',
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
      }
    ];
    
    for (const healthData of healthDataUpdates) {
      const child = children.find(c => c.name === healthData.name);
      if (child) {
        await Child.findByIdAndUpdate(child._id, {
          $set: {
            currentWeight: healthData.currentWeight,
            currentHeight: healthData.currentHeight,
            bloodGroup: healthData.bloodGroup,
            nutritionStatus: healthData.nutritionStatus,
            specialNeeds: healthData.specialNeeds || null,
            vaccinations: healthData.vaccinations
          }
        });
        console.log(`✅ Updated health data for ${child.name}`);
      }
    }
    
    // Verify updates
    const updatedChildren = await Child.find({ anganwadiCenter: 'Akkarakunnu Anganwadi' });
    console.log('\nUpdated children health data:');
    updatedChildren.forEach(child => {
      console.log(`- ${child.name}: ${child.currentWeight}kg, ${child.currentHeight}cm, ${child.bloodGroup}, ${child.vaccinations?.length || 0} vaccinations`);
    });
    
    mongoose.disconnect();
    console.log('\nHealth data update completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addHealthDataToChildren();