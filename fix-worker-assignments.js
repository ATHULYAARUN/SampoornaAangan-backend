const mongoose = require('mongoose');
const User = require('./models/User');
const AnganwadiCenter = require('./models/AnganwadiCenter');
const Child = require('./models/Child');
require('dotenv').config();

async function fixWorkerAssignments() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔧 FIXING WORKER ASSIGNMENTS...\n');
    
    // Get existing workers
    const mohanakumari = await User.findOne({ email: 'athulyaarunu@gmail.com' });
    const athulya = await User.findOne({ email: 'athulyaanal@gmail.com' });
    
    // Get existing centers
    const centers = await AnganwadiCenter.find({});
    console.log(`Found ${centers.length} existing centers:`);
    centers.forEach(center => {
      console.log(`  - ${center.name} (${center.code})`);
    });
    
    // Find or use existing centers
    let akkarankunnuCenter = await AnganwadiCenter.findOne({ name: /Akkarakunnu/i });
    let veliyanoorCenter = await AnganwadiCenter.findOne({ name: /Veliyanoor/i });
    
    console.log('\n📋 Updating center assignments...');
    
    // Update Akkarakunnu center with Mohanakumari
    if (akkarankunnuCenter && mohanakumari) {
      await AnganwadiCenter.findByIdAndUpdate(akkarankunnuCenter._id, {
        assignedWorker: mohanakumari._id,
        contact: {
          phone: mohanakumari.phone,
          email: 'akkarakunnu@anganwadi.gov.in'
        }
      });
      console.log('✅ Mohanakumari assigned to Akkarakunnu center');
    }
    
    // Update Veliyanoor center with Athulya
    if (veliyanoorCenter && athulya) {
      await AnganwadiCenter.findByIdAndUpdate(veliyanoorCenter._id, {
        assignedWorker: athulya._id,
        contact: {
          phone: athulya.phone,
          email: 'veliyanoor@anganwadi.gov.in'
        }
      });
      console.log('✅ Athulya Arun assigned to Veliyanoor center');
    }
    
    // Update worker profiles with correct center names
    if (mohanakumari && akkarankunnuCenter) {
      await User.findByIdAndUpdate(mohanakumari._id, {
        roleSpecificData: {
          anganwadiCenter: {
            name: akkarankunnuCenter.name,
            code: akkarankunnuCenter.code,
            location: 'Akkarakunnu, Kasaragod'
          }
        }
      });
      console.log(`✅ Mohanakumari profile updated with center: ${akkarankunnuCenter.name}`);
    }
    
    if (athulya && veliyanoorCenter) {
      await User.findByIdAndUpdate(athulya._id, {
        roleSpecificData: {
          anganwadiCenter: {
            name: veliyanoorCenter.name,
            code: veliyanoorCenter.code,
            location: 'Veliyanoor, Kasaragod'
          }
        }
      });
      console.log(`✅ Athulya Arun profile updated with center: ${veliyanoorCenter.name}`);
    }
    
    // Update children assignments based on actual center names
    console.log('\n👶 Updating children assignments...');
    
    if (akkarankunnuCenter) {
      await Child.updateMany(
        { name: { $in: ['Akhil', 'Athulya'] } },
        { anganwadiCenter: akkarankunnuCenter.name }
      );
      console.log(`✅ Akhil and Athulya assigned to ${akkarankunnuCenter.name}`);
    }
    
    if (veliyanoorCenter) {
      const otherChildren = await Child.find({ 
        name: { $not: { $in: ['Akhil', 'Athulya'] } } 
      });
      
      for (let child of otherChildren) {
        await Child.findByIdAndUpdate(child._id, {
          anganwadiCenter: veliyanoorCenter.name
        });
      }
      console.log(`✅ ${otherChildren.length} other children assigned to ${veliyanoorCenter.name}`);
    }
    
    // Final verification
    console.log('\n🔍 FINAL VERIFICATION:');
    
    const updatedMohanakumari = await User.findOne({ email: 'athulyaarunu@gmail.com' });
    const updatedAthulya = await User.findOne({ email: 'athulyaanal@gmail.com' });
    
    console.log('\n👩‍🏫 WORKER ASSIGNMENTS:');
    if (updatedMohanakumari) {
      console.log(`   📧 Mohanakumari: ${updatedMohanakumari.email}`);
      console.log(`   🏢 Center: ${updatedMohanakumari.roleSpecificData?.anganwadiCenter?.name || 'Not assigned'}`);
      console.log(`   📱 Phone: ${updatedMohanakumari.phone}`);
    }
    
    if (updatedAthulya) {
      console.log(`   📧 Athulya Arun: ${updatedAthulya.email}`);
      console.log(`   🏢 Center: ${updatedAthulya.roleSpecificData?.anganwadiCenter?.name || 'Not assigned'}`);
      console.log(`   📱 Phone: ${updatedAthulya.phone}`);
    }
    
    // Check children distribution
    const childrenByCenter = await Child.aggregate([
      { $group: { _id: '$anganwadiCenter', count: { $sum: 1 }, children: { $push: '$name' } } }
    ]);
    
    console.log('\n👶 CHILDREN DISTRIBUTION:');
    childrenByCenter.forEach(group => {
      console.log(`   🏢 ${group._id}: ${group.count} children`);
      console.log(`   👶 Children: ${group.children.join(', ')}`);
    });
    
    console.log('\n🎉 WORKER ASSIGNMENTS COMPLETED!');
    console.log('\n📋 READY FOR ATTENDANCE MARKING:');
    console.log('   🔐 Mohanakumari: athulyaarunu@gmail.com');
    console.log('   🔐 Athulya Arun: athulyaanal@gmail.com');
    
  } catch (error) {
    console.error('❌ Error fixing assignments:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Database connection closed');
  }
}

fixWorkerAssignments();