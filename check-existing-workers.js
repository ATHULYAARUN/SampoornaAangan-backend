const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function checkExistingWorkers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🔍 CHECKING EXISTING ANGANWADI WORKERS...\n');
    
    // Find all anganwadi workers
    const workers = await User.find({ role: 'anganwadi-worker' }).select('name email phone roleSpecificData');
    
    console.log(`📊 Found ${workers.length} anganwadi workers:\n`);
    
    workers.forEach((worker, index) => {
      console.log(`${index + 1}. ${worker.name}`);
      console.log(`   Email: ${worker.email}`);
      console.log(`   Phone: ${worker.phone || 'Not set'}`);
      console.log(`   Center: ${worker.roleSpecificData?.anganwadiCenter?.name || 'Not assigned'}`);
      console.log('');
    });
    
    // Check specific workers mentioned
    const athulya = await User.findOne({ email: 'athulyaanal@gmail.com' });
    const mohanakumari = await User.findOne({ email: 'athulyaarunu@gmail.com' });
    
    console.log('🎯 SPECIFIC WORKERS CHECK:\n');
    
    if (athulya) {
      console.log(`✅ Athulya Arun found:`);
      console.log(`   Name: ${athulya.name}`);
      console.log(`   Email: ${athulya.email}`);
      console.log(`   Role: ${athulya.role}`);
      console.log(`   Center: ${athulya.roleSpecificData?.anganwadiCenter?.name || 'Not assigned'}`);
    } else {
      console.log(`❌ Athulya Arun (athulyaanal@gmail.com) not found`);
    }
    
    console.log('');
    
    if (mohanakumari) {
      console.log(`✅ Mohanakumari found:`);
      console.log(`   Name: ${mohanakumari.name}`);
      console.log(`   Email: ${mohanakumari.email}`);
      console.log(`   Role: ${mohanakumari.role}`);
      console.log(`   Center: ${mohanakumari.roleSpecificData?.anganwadiCenter?.name || 'Not assigned'}`);
    } else {
      console.log(`❌ Mohanakumari (athulyaarunu@gmail.com) not found`);
    }
    
  } catch (error) {
    console.error('❌ Error checking workers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Database connection closed');
  }
}

checkExistingWorkers();