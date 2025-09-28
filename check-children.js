require('dotenv').config();
const mongoose = require('mongoose');
const Child = require('./models/Child');

async function checkChildren() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    console.log('Connected to MongoDB');
    
    const children = await Child.find({}).limit(10);
    console.log(`Found ${children.length} children in database:`);
    
    children.forEach(child => {
      console.log(`- ${child.name} (${child.gender}, ${child.anganwadiCenter})`);
    });
    
    if (children.length === 0) {
      console.log('No children found. Creating sample data...');
      
      const sampleChildren = [
        {
          name: 'Aarav Kumar',
          dateOfBirth: new Date('2021-05-15'),
          gender: 'male',
          parentName: 'Raj Kumar',
          parentPhone: '9876543210',
          relationToChild: 'father',
          anganwadiCenter: 'Demo Anganwadi Center',
          address: {
            street: '123 Village Road',
            village: 'Rampur',
            block: 'Central Block',
            district: 'Demo District',
            state: 'Demo State',
            pincode: '123456'
          }
        },
        {
          name: 'Priya Sharma',
          dateOfBirth: new Date('2020-08-22'),
          gender: 'female',
          parentName: 'Sunita Sharma',
          parentPhone: '9876543211',
          relationToChild: 'mother',
          anganwadiCenter: 'Demo Anganwadi Center',
          address: {
            street: '456 Main Street',
            village: 'Rampur',
            block: 'Central Block',
            district: 'Demo District',
            state: 'Demo State',
            pincode: '123456'
          }
        },
        {
          name: 'Rahul Singh',
          dateOfBirth: new Date('2022-01-10'),
          gender: 'male',
          parentName: 'Amit Singh',
          parentPhone: '9876543212',
          relationToChild: 'father',
          anganwadiCenter: 'Demo Anganwadi Center',
          address: {
            street: '789 School Lane',
            village: 'Rampur',
            block: 'Central Block',
            district: 'Demo District',
            state: 'Demo State',
            pincode: '123456'
          }
        },
        {
          name: 'Anita Devi',
          dateOfBirth: new Date('2019-12-03'),
          gender: 'female',
          parentName: 'Geeta Devi',
          parentPhone: '9876543213',
          relationToChild: 'mother',
          anganwadiCenter: 'Demo Anganwadi Center',
          address: {
            street: '321 Temple Road',
            village: 'Rampur',
            block: 'Central Block',
            district: 'Demo District',
            state: 'Demo State',
            pincode: '123456'
          }
        },
        {
          name: 'Vikash Kumar',
          dateOfBirth: new Date('2021-07-18'),
          gender: 'male',
          parentName: 'Rakesh Kumar',
          parentPhone: '9876543214',
          relationToChild: 'father',
          anganwadiCenter: 'Demo Anganwadi Center',
          address: {
            street: '654 Market Street',
            village: 'Rampur',
            block: 'Central Block',
            district: 'Demo District',
            state: 'Demo State',
            pincode: '123456'
          }
        }
      ];
      
      await Child.insertMany(sampleChildren);
      console.log('Sample children created successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkChildren();