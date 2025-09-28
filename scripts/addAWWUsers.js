const mongoose = require('mongoose');
const User = require('../models/User');
const AnganwadiCenter = require('../models/AnganwadiCenter');
require('dotenv').config();

const addAWWUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create AWW users
    const awwUsers = [
      {
        name: 'Mohanakumari',
        email: 'mohanakumari@anganwadi.gov.in',
        phoneNumber: '9876543210',
        role: 'anganwadi-worker',
        isActive: true,
        wardNumber: 9,
        anganwadiCenter: 'Akkarakkunnu Anganwadi',
        firebaseUid: 'aww_mohanakumari_' + Date.now()
      },
      {
        name: 'Susheela',
        email: 'susheela@anganwadi.gov.in',
        phoneNumber: '9876543211',
        role: 'anganwadi-worker',
        isActive: true,
        wardNumber: 9,
        anganwadiCenter: 'Veliyanoor Anganwadi',
        firebaseUid: 'aww_susheela_' + (Date.now() + 1)
      }
    ];

    // Check if users already exist
    for (const userData of awwUsers) {
      const existingUser = await User.findOne({ email: userData.email });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        console.log(`✅ Created AWW user: ${userData.name}`);
        
        // Assign user to the corresponding Anganwadi center
        const center = await AnganwadiCenter.findOne({ name: userData.anganwadiCenter });
        if (center) {
          center.assignedWorker = user._id;
          await center.save();
          console.log(`✅ Assigned ${userData.name} to ${userData.anganwadiCenter}`);
        }
      } else {
        console.log(`⚠️  User ${userData.name} already exists`);
      }
    }

    console.log('\n✅ AWW users setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up AWW users:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
if (require.main === module) {
  addAWWUsers();
}

module.exports = addAWWUsers;