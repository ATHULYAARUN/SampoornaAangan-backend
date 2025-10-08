const mongoose = require('mongoose');
const User = require('./models/User');
const Child = require('./models/Child');
require('dotenv').config();

async function fixChildrenAssignment() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔧 FIXING CHILDREN ASSIGNMENTS...\n');
    
    // Get workers and their centers
    const mohanakumari = await User.findOne({ email: 'athulyaarunu@gmail.com' });
    const athulya = await User.findOne({ email: 'athulyaanal@gmail.com' });
    
    console.log('👩‍🏫 WORKERS:');
    if (mohanakumari) {
      console.log(`   Mohanakumari: ${mohanakumari.roleSpecificData?.anganwadiCenter?.name || 'No center'}`);
    }
    if (athulya) {
      console.log(`   Athulya Arun: ${athulya.roleSpecificData?.anganwadiCenter?.name || 'No center'}`);
    }
    
    // Check all children and their current assignments
    const allChildren = await Child.find({});
    console.log(`\n👶 ALL CHILDREN (${allChildren.length}):`);
    allChildren.forEach(child => {
      console.log(`   - ${child.name} (${child.anganwadiCenter || 'No center assigned'})`);
    });
    
    // Reassign children properly
    console.log('\n🔄 REASSIGNING CHILDREN...');
    
    // Assign Akhil and Athulya to Mohanakumari's center (Akkarakunnu)
    if (mohanakumari?.roleSpecificData?.anganwadiCenter?.name) {
      const result1 = await Child.updateMany(
        { name: { $in: ['Akhil', 'Athulya'] } },
        { anganwadiCenter: mohanakumari.roleSpecificData.anganwadiCenter.name }
      );
      console.log(`✅ Updated ${result1.modifiedCount} children for Akkarakunnu Anganwadi`);
    }
    
    // Assign other children to Athulya's center (Veliyanoor)
    if (athulya?.roleSpecificData?.anganwadiCenter?.name) {
      const result2 = await Child.updateMany(
        { name: { $not: { $in: ['Akhil', 'Athulya'] } } },
        { anganwadiCenter: athulya.roleSpecificData.anganwadiCenter.name }
      );
      console.log(`✅ Updated ${result2.modifiedCount} children for Veliyanoor Anganwadi`);
    }
    
    // Verify assignments
    console.log('\n🔍 VERIFICATION:');
    const updatedChildren = await Child.find({});
    
    const groupedChildren = {};
    updatedChildren.forEach(child => {
      if (!groupedChildren[child.anganwadiCenter]) {
        groupedChildren[child.anganwadiCenter] = [];
      }
      groupedChildren[child.anganwadiCenter].push(child.name);
    });
    
    Object.keys(groupedChildren).forEach(center => {
      console.log(`\n🏢 ${center}:`);
      console.log(`   👶 Children: ${groupedChildren[center].join(', ')}`);
      console.log(`   📊 Count: ${groupedChildren[center].length}`);
    });
    
    // Test worker access
    console.log('\n🧪 TESTING WORKER ACCESS:');
    
    if (mohanakumari) {
      const mohanakumariChildren = await Child.find({ 
        anganwadiCenter: mohanakumari.roleSpecificData.anganwadiCenter.name 
      });
      console.log(`\n👩‍🏫 Mohanakumari can access: ${mohanakumariChildren.length} children`);
      mohanakumariChildren.forEach(child => {
        console.log(`   - ${child.name} (${child.age} years)`);
      });
    }
    
    if (athulya) {
      const athulyaChildren = await Child.find({ 
        anganwadiCenter: athulya.roleSpecificData.anganwadiCenter.name 
      });
      console.log(`\n👩‍🏫 Athulya Arun can access: ${athulyaChildren.length} children`);
      athulyaChildren.forEach(child => {
        console.log(`   - ${child.name} (${child.age} years)`);
      });
    }
    
    console.log('\n✅ CHILDREN ASSIGNMENT COMPLETED!');
    
  } catch (error) {
    console.error('❌ Error fixing children assignment:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Database connection closed');
  }
}

fixChildrenAssignment();