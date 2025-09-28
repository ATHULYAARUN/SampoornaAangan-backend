const mongoose = require('mongoose');
const Child = require('./models/Child');

async function fixAnganwadiCenterNames() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sampoornaangan');
    console.log('Connected to MongoDB');
    
    // Find all children with variations of Akkarakunnu
    const children = await Child.find({
      anganwadiCenter: { $in: ['Akkarakunnu', 'Akkarakunnu Anganwadi'] }
    });
    
    console.log('Found children with Akkarakunnu variations:');
    children.forEach(child => {
      console.log(`- ${child.name}: '${child.anganwadiCenter}'`);
    });
    
    // Standardize to "Akkarakunnu Anganwadi"
    const updateResult = await Child.updateMany(
      { anganwadiCenter: 'Akkarakunnu' },
      { $set: { anganwadiCenter: 'Akkarakunnu Anganwadi' } }
    );
    
    console.log(`\nUpdated ${updateResult.modifiedCount} children to use 'Akkarakunnu Anganwadi'`);
    
    // Verify the update
    const updatedChildren = await Child.find({
      anganwadiCenter: 'Akkarakunnu Anganwadi'
    });
    
    console.log('\nAfter update:');
    updatedChildren.forEach(child => {
      console.log(`- ${child.name}: '${child.anganwadiCenter}'`);
    });
    
    mongoose.disconnect();
    console.log('\nDatabase update completed successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAnganwadiCenterNames();