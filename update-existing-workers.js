const mongoose = require('mongoose');
const User = require('./models/User');
const AnganwadiCenter = require('./models/AnganwadiCenter');
const Child = require('./models/Child');
require('dotenv').config();

async function updateExistingWorkers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔄 UPDATING EXISTING ANGANWADI WORKERS...\n');
    
    // Update Mohanakumari at Akkarakunnu
    const mohanakumari = await User.findOne({ email: 'athulyaarunu@gmail.com' });
    if (mohanakumari) {
      console.log('📝 Updating Mohanakumari profile...');
      await User.findByIdAndUpdate(mohanakumari._id, {
        roleSpecificData: {
          anganwadiCenter: {
            name: 'Akkarakunnu Anganwadi',
            code: 'AWC09001',
            location: 'Akkarakunnu, Kasaragod'
          }
        },
        address: {
          ...mohanakumari.address,
          village: 'Akkarakunnu',
          district: 'Kasaragod',
          state: 'Kerala'
        }
      });
      console.log('✅ Mohanakumari profile updated for Akkarakunnu Anganwadi');
    }
    
    // Update Athulya Arun at Veliyanoor
    const athulya = await User.findOne({ email: 'athulyaanal@gmail.com' });
    if (athulya) {
      console.log('📝 Updating Athulya Arun profile...');
      await User.findByIdAndUpdate(athulya._id, {
        roleSpecificData: {
          anganwadiCenter: {
            name: 'Veliyanoor Anganwadi',
            code: 'AWC09002',
            location: 'Veliyanoor, Kasaragod'
          }
        },
        address: {
          ...athulya.address,
          village: 'Veliyanoor',
          district: 'Kasaragod',
          state: 'Kerala'
        }
      });
      console.log('✅ Athulya Arun profile updated for Veliyanoor Anganwadi');
    }
    
    // Ensure anganwadi centers exist with correct names
    console.log('\n📋 Ensuring anganwadi centers exist...');
    
    const akkarankunnuCenter = await AnganwadiCenter.findOneAndUpdate(
      { name: /Akkarakunnu/i },
      {
        name: 'Akkarakunnu Anganwadi',
        code: 'AWC09001',
        ward: { number: 9, name: 'Ward 9' },
        address: {
          locality: 'Akkarakunnu',
          district: 'Kasaragod',
          state: 'Kerala',
          pincode: '671121'
        },
        contact: {
          phone: '9056892345',
          email: 'akkarakunnu@anganwadi.gov.in'
        },
        assignedWorker: mohanakumari ? mohanakumari._id : null,
        status: 'active'
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    const veliyanoorCenter = await AnganwadiCenter.findOneAndUpdate(
      { name: /Veliyanoor/i },
      {
        name: 'Veliyanoor Anganwadi',
        code: 'AWC09002',
        ward: { number: 9, name: 'Ward 9' },
        address: {
          locality: 'Veliyanoor',
          district: 'Kasaragod',
          state: 'Kerala',
          pincode: '671122'
        },
        contact: {
          phone: '7012613467',
          email: 'veliyanoor@anganwadi.gov.in'
        },
        assignedWorker: athulya ? athulya._id : null,
        status: 'active'
      },
      { 
        upsert: true, 
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    console.log('✅ Anganwadi centers updated');
    
    // Update children assignments
    console.log('\n👶 Updating children assignments...');
    
    // Assign children to Akkarakunnu (Mohanakumari's center)
    await Child.updateMany(
      { name: { $in: ['Akhil', 'Athulya'] } },
      { anganwadiCenter: 'Akkarakunnu Anganwadi' }
    );
    console.log('✅ Akhil and Athulya assigned to Akkarakunnu Anganwadi');
    
    // Assign other children to Veliyanoor (Athulya Arun's center)
    const otherChildren = await Child.find({ 
      name: { $not: { $in: ['Akhil', 'Athulya'] } } 
    });
    
    for (let child of otherChildren) {
      await Child.findByIdAndUpdate(child._id, {
        anganwadiCenter: 'Veliyanoor Anganwadi'
      });
    }
    console.log(`✅ ${otherChildren.length} other children assigned to Veliyanoor Anganwadi`);
    
    // Verification
    console.log('\n🔍 VERIFICATION:');
    
    const updatedMohanakumari = await User.findOne({ email: 'athulyaarunu@gmail.com' });
    const updatedAthulya = await User.findOne({ email: 'athulyaanal@gmail.com' });
    
    console.log('\n👩‍🏫 UPDATED WORKERS:');
    if (updatedMohanakumari) {
      console.log(`   Mohanakumari (${updatedMohanakumari.email})`);
      console.log(`   Center: ${updatedMohanakumari.roleSpecificData?.anganwadiCenter?.name}`);
      console.log(`   Phone: ${updatedMohanakumari.phone}`);
    }
    
    if (updatedAthulya) {
      console.log(`   Athulya Arun (${updatedAthulya.email})`);
      console.log(`   Center: ${updatedAthulya.roleSpecificData?.anganwadiCenter?.name}`);
      console.log(`   Phone: ${updatedAthulya.phone}`);
    }
    
    // Check children distribution
    const childrenByCenter = await Child.aggregate([
      { $group: { _id: '$anganwadiCenter', count: { $sum: 1 }, children: { $push: '$name' } } }
    ]);
    
    console.log('\n👶 CHILDREN BY CENTER:');
    childrenByCenter.forEach(group => {
      console.log(`   ${group._id}: ${group.count} children`);
      console.log(`   Children: ${group.children.join(', ')}`);
    });
    
    console.log('\n🎉 WORKER UPDATES COMPLETED!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   Mohanakumari: athulyaarunu@gmail.com (Akkarakunnu Anganwadi)');
    console.log('   Athulya Arun: athulyaanal@gmail.com (Veliyanoor Anganwadi)');
    
  } catch (error) {
    console.error('❌ Error updating workers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Database connection closed');
  }
}

updateExistingWorkers();