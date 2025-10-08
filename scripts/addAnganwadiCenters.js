const mongoose = require('mongoose');
const AnganwadiCenter = require('../models/AnganwadiCenter');
require('dotenv').config();

const addAnganwadiCenters = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing centers (optional - remove if you want to keep existing data)
    await AnganwadiCenter.deleteMany({});
    console.log('Cleared existing centers');

    // Add the two Anganwadi centers
    const centers = [
      {
        name: 'Akkarakkunnu Anganwadi',
        code: 'AWC09001',
        ward: {
          number: 9,
          name: 'Ward 9'
        },
        address: {
          locality: 'Akkarakkunnu',
          district: 'Kottayam',
          state: 'Kerala',
          pincode: '695502'
        },
        contact: {
          phone: '9876543210',
          email: 'akkarakkunnu@anganwadi.gov.in'
        },
        assignedWorker: null, // We'll need to link this to actual user IDs later
        capacity: {
          children: 50,
          adolescents: 25,
          pregnantWomen: 15
        },
        facilities: ['kitchen', 'playground', 'toilet', 'water_supply', 'electricity', 'medical_kit', 'weighing_scale', 'height_chart'],
        status: 'active',
        operatingHours: {
          start: '09:00',
          end: '16:00',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        services: ['supplementary_nutrition', 'immunization', 'health_checkup', 'pre_school_education', 'nutrition_health_education'],
        statistics: {
          totalBeneficiaries: 45,
          activeChildren: 35,
          activeAdolescents: 8,
          pregnantWomen: 2
        }
      },
      {
        name: 'Veliyanoor Anganwadi',
        code: 'AWC09002',
        ward: {
          number: 9,
          name: 'Ward 9'
        },
        address: {
          locality: 'Veliyanoor',
          district: 'Kottayam',
          state: 'Kerala',
          pincode: '695502'
        },
        contact: {
          phone: '9876543211',
          email: 'veliyanoor@anganwadi.gov.in'
        },
        assignedWorker: null, // We'll need to link this to actual user IDs later
        capacity: {
          children: 50,
          adolescents: 25,
          pregnantWomen: 15
        },
        facilities: ['kitchen', 'playground', 'toilet', 'water_supply', 'electricity', 'medical_kit', 'weighing_scale', 'height_chart'],
        status: 'active',
        operatingHours: {
          start: '09:00',
          end: '16:00',
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        },
        services: ['supplementary_nutrition', 'immunization', 'health_checkup', 'pre_school_education', 'nutrition_health_education'],
        statistics: {
          totalBeneficiaries: 38,
          activeChildren: 30,
          activeAdolescents: 6,
          pregnantWomen: 2
        }
      }
    ];

    // Insert the centers
    const insertedCenters = await AnganwadiCenter.insertMany(centers);
    console.log('Successfully added Anganwadi centers:');
    insertedCenters.forEach(center => {
      console.log(`- ${center.name} (${center.code}) - Ward ${center.ward.number}`);
    });

    console.log('\n✅ Anganwadi centers setup completed!');
    
  } catch (error) {
    console.error('❌ Error setting up Anganwadi centers:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
if (require.main === module) {
  addAnganwadiCenters();
}

module.exports = addAnganwadiCenters;