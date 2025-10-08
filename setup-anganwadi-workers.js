const mongoose = require('mongoose');
const User = require('./models/User');
const AnganwadiCenter = require('./models/AnganwadiCenter');
const Child = require('./models/Child');
require('dotenv').config();

async function setupAnganwadiWorkers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('✅ Connected to MongoDB');
    
    console.log('\n🚀 Setting up Anganwadi Workers...\n');
    
    // Check if anganwadi centers exist, if not create them
    const akkarankunnuCenter = await AnganwadiCenter.findOne({ name: /Akkarakkunnu/i });
    const veliyanoorCenter = await AnganwadiCenter.findOne({ name: /Veliyanoor/i });
    
    if (!akkarankunnuCenter || !veliyanoorCenter) {
      console.log('📋 Creating Anganwadi Centers...');
      
      const centers = [
        {
          name: 'Akkarakkunnu Anganwadi',
          code: 'AWC09001',
          ward: { number: 9, name: 'Ward 9' },
          address: {
            locality: 'Akkarakkunnu',
            district: 'Kasaragod',
            state: 'Kerala',
            pincode: '671121'
          },
          contact: {
            phone: '9876543210',
            email: 'akkarakkunnu@anganwadi.gov.in'
          },
          capacity: { children: 50, adolescents: 25, pregnantWomen: 15 },
          facilities: ['kitchen', 'playground', 'toilet', 'water_supply', 'electricity', 'medical_kit'],
          status: 'active',
          operatingHours: {
            start: '09:00',
            end: '16:00',
            workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          },
          services: ['supplementary_nutrition', 'immunization', 'health_checkup', 'pre_school_education']
        },
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
            phone: '9876543211',
            email: 'veliyanoor@anganwadi.gov.in'
          },
          capacity: { children: 50, adolescents: 25, pregnantWomen: 15 },
          facilities: ['kitchen', 'playground', 'toilet', 'water_supply', 'electricity', 'medical_kit'],
          status: 'active',
          operatingHours: {
            start: '09:00',
            end: '16:00',
            workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
          },
          services: ['supplementary_nutrition', 'immunization', 'health_checkup', 'pre_school_education']
        }
      ];
      
      await AnganwadiCenter.deleteMany({});
      await AnganwadiCenter.insertMany(centers);
      console.log('✅ Anganwadi Centers created');
    }
    
    // Get the updated centers
    const updatedAkkarankunnuCenter = await AnganwadiCenter.findOne({ name: /Akkarakkunnu/i });
    const updatedVeliyanoorCenter = await AnganwadiCenter.findOne({ name: /Veliyanoor/i });
    
    // Check if workers already exist
    const existingMohanakumari = await User.findOne({ email: 'mohanakumari@anganwadi.gov.in' });
    const existingAthulya = await User.findOne({ email: 'athulya.arun@anganwadi.gov.in' });
    
    // Worker 1: Mohanakumari at Akkarakkunnu Anganwadi
    if (existingMohanakumari) {
      console.log('📝 Updating Mohanakumari profile...');
      await User.findByIdAndUpdate(existingMohanakumari._id, {
        name: 'Mohanakumari',
        phone: '9876543210',
        gender: 'female',
        dateOfBirth: new Date('1985-03-15'),
        qualification: '12th-pass',
        dateOfJoining: new Date('2020-06-01'),
        designation: 'worker',
        experience: 5,
        alternatePhone: '9876543220',
        emergencyContactPerson: 'Radhika (Sister)',
        role: 'anganwadi-worker',
        address: {
          street: 'Main Road',
          village: 'Akkarakkunnu',
          block: 'Kasaragod',
          city: 'Akkarakkunnu',
          district: 'Kasaragod',
          state: 'Kerala',
          pincode: '671121'
        },
        roleSpecificData: {
          anganwadiCenter: {
            name: 'Akkarakkunnu Anganwadi',
            code: 'AWC09001',
            location: 'Akkarakkunnu, Kasaragod'
          }
        },
        isActive: true,
        isVerified: true
      });
      console.log('✅ Mohanakumari profile updated');
    } else {
      console.log('➕ Creating Mohanakumari profile...');
      const mohanakumari = new User({
        name: 'Mohanakumari',
        email: 'mohanakumari@anganwadi.gov.in',
        phone: '9876543210',
        firebaseUid: `firebase_mohanakumari_${Date.now()}`, // Unique firebaseUid
        gender: 'female',
        dateOfBirth: new Date('1985-03-15'),
        qualification: '12th-pass',
        dateOfJoining: new Date('2020-06-01'),
        designation: 'worker',
        experience: 5,
        alternatePhone: '9876543220',
        emergencyContactPerson: 'Radhika (Sister)',
        role: 'anganwadi-worker',
        address: {
          street: 'Main Road',
          village: 'Akkarakkunnu',
          block: 'Kasaragod',
          city: 'Akkarakkunnu',
          district: 'Kasaragod',
          state: 'Kerala',
          pincode: '671121'
        },
        roleSpecificData: {
          anganwadiCenter: {
            name: 'Akkarakkunnu Anganwadi',
            code: 'AWC09001',
            location: 'Akkarakkunnu, Kasaragod'
          }
        },
        tempPassword: 'Mohan@2025',
        isActive: true,
        isVerified: true
      });
      await mohanakumari.save();
      console.log('✅ Mohanakumari profile created');
    }
    
    // Worker 2: Athulya Arun at Veliyanoor Anganwadi
    if (existingAthulya) {
      console.log('📝 Updating Athulya Arun profile...');
      await User.findByIdAndUpdate(existingAthulya._id, {
        name: 'Athulya Arun',
        phone: '9876543211',
        gender: 'female',
        dateOfBirth: new Date('1988-07-22'),
        qualification: 'graduate',
        dateOfJoining: new Date('2019-04-15'),
        designation: 'worker',
        experience: 6,
        alternatePhone: '9876543221',
        emergencyContactPerson: 'Arun (Husband)',
        role: 'anganwadi-worker',
        address: {
          street: 'Temple Road',
          village: 'Veliyanoor',
          block: 'Kasaragod',
          city: 'Veliyanoor',
          district: 'Kasaragod',
          state: 'Kerala',
          pincode: '671122'
        },
        roleSpecificData: {
          anganwadiCenter: {
            name: 'Veliyanoor Anganwadi',
            code: 'AWC09002',
            location: 'Veliyanoor, Kasaragod'
          }
        },
        isActive: true,
        isVerified: true
      });
      console.log('✅ Athulya Arun profile updated');
    } else {
      console.log('➕ Creating Athulya Arun profile...');
      const athulyaArun = new User({
        name: 'Athulya Arun',
        email: 'athulya.arun@anganwadi.gov.in',
        phone: '9876543211',
        firebaseUid: `firebase_athulya_${Date.now()}`, // Unique firebaseUid
        gender: 'female',
        dateOfBirth: new Date('1988-07-22'),
        qualification: 'graduate',
        dateOfJoining: new Date('2019-04-15'),
        designation: 'worker',
        experience: 6,
        alternatePhone: '9876543221',
        emergencyContactPerson: 'Arun (Husband)',
        role: 'anganwadi-worker',
        address: {
          street: 'Temple Road',
          village: 'Veliyanoor',
          block: 'Kasaragod',
          city: 'Veliyanoor',
          district: 'Kasaragod',
          state: 'Kerala',
          pincode: '671122'
        },
        roleSpecificData: {
          anganwadiCenter: {
            name: 'Veliyanoor Anganwadi',
            code: 'AWC09002',
            location: 'Veliyanoor, Kasaragod'
          }
        },
        tempPassword: 'Athulya@2025',
        isActive: true,
        isVerified: true
      });
      await athulyaArun.save();
      console.log('✅ Athulya Arun profile created');
    }
    
    // Update anganwadi centers with worker assignments
    if (updatedAkkarankunnuCenter) {
      const mohanakumariUser = await User.findOne({ email: 'mohanakumari@anganwadi.gov.in' });
      await AnganwadiCenter.findByIdAndUpdate(updatedAkkarankunnuCenter._id, {
        assignedWorker: mohanakumariUser._id
      });
      console.log('✅ Assigned Mohanakumari to Akkarakkunnu Anganwadi');
    }
    
    if (updatedVeliyanoorCenter) {
      const athulyaUser = await User.findOne({ email: 'athulya.arun@anganwadi.gov.in' });
      await AnganwadiCenter.findByIdAndUpdate(updatedVeliyanoorCenter._id, {
        assignedWorker: athulyaUser._id
      });
      console.log('✅ Assigned Athulya Arun to Veliyanoor Anganwadi');
    }
    
    // Update existing children to be associated with appropriate anganwadis
    console.log('📝 Updating children anganwadi assignments...');
    
    // Assign Akhil and Athulya to Akkarakkunnu (where we have their health data)
    await Child.updateMany(
      { name: { $in: ['Akhil', 'Athulya'] } },
      { anganwadiCenter: 'Akkarakkunnu Anganwadi' }
    );
    
    // Assign other children to Veliyanoor for variety
    const otherChildren = await Child.find({ 
      name: { $not: { $in: ['Akhil', 'Athulya'] } } 
    }).limit(3);
    
    for (let child of otherChildren) {
      await Child.findByIdAndUpdate(child._id, {
        anganwadiCenter: 'Veliyanoor Anganwadi'
      });
    }
    
    console.log('✅ Children anganwadi assignments updated');
    
    // Verification
    console.log('\n🔍 VERIFICATION:');
    const workers = await User.find({ role: 'anganwadi-worker' }).select('name email roleSpecificData.anganwadiCenter');
    const centers = await AnganwadiCenter.find({}).populate('assignedWorker', 'name email');
    const childrenByCenter = await Child.aggregate([
      { $group: { _id: '$anganwadiCenter', count: { $sum: 1 }, children: { $push: '$name' } } }
    ]);
    
    console.log('\n👩‍🏫 ANGANWADI WORKERS:');
    workers.forEach(worker => {
      console.log(`   - ${worker.name} (${worker.email})`);
      console.log(`     Center: ${worker.roleSpecificData?.anganwadiCenter?.name || 'Not assigned'}`);
    });
    
    console.log('\n🏢 ANGANWADI CENTERS:');
    centers.forEach(center => {
      console.log(`   - ${center.name} (${center.code})`);
      console.log(`     Worker: ${center.assignedWorker?.name || 'Not assigned'}`);
    });
    
    console.log('\n👶 CHILDREN BY CENTER:');
    childrenByCenter.forEach(group => {
      console.log(`   - ${group._id}: ${group.count} children`);
      console.log(`     Children: ${group.children.join(', ')}`);
    });
    
    console.log('\n🎉 ANGANWADI WORKER SETUP COMPLETED SUCCESSFULLY!');
    console.log('\n📋 LOGIN CREDENTIALS:');
    console.log('   Mohanakumari: mohanakumari@anganwadi.gov.in / Mohan@2025');
    console.log('   Athulya Arun: athulya.arun@anganwadi.gov.in / Athulya@2025');
    
  } catch (error) {
    console.error('❌ Error setting up anganwadi workers:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📝 Database connection closed');
  }
}

// Run the setup
console.log('🚀 Starting Anganwadi Workers Setup...\n');
setupAnganwadiWorkers();