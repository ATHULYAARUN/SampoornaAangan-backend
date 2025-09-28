const mongoose = require('mongoose');
const User = require('./models/User');
const Child = require('./models/Child');

async function checkUserAndChildData() {
  try {
    await mongoose.connect('mongodb://localhost:27017/sampoornaangan');
    console.log('Connected to MongoDB');
    
    // Check workers
    const workers = await User.find({ role: 'worker' });
    console.log('\n=== WORKERS ===');
    console.log('Found', workers.length, 'workers:');
    
    workers.forEach(worker => {
      console.log(`- ${worker.name || worker.email}: center '${worker.anganwadiCenter}'`);
    });
    
    // Check children and their centers
    const children = await Child.find({});
    console.log('\n=== CHILDREN ===');
    console.log('Found', children.length, 'children:');
    
    const centerCounts = {};
    children.forEach(child => {
      const center = child.anganwadiCenter;
      if (!centerCounts[center]) {
        centerCounts[center] = 0;
      }
      centerCounts[center]++;
      console.log(`- ${child.name}: '${center}'`);
    });
    
    console.log('\n=== CENTER SUMMARY ===');
    Object.entries(centerCounts).forEach(([center, count]) => {
      console.log(`- '${center}': ${count} children`);
    });
    
    // Check if we need to update any data for consistency
    const uniqueCenters = [...new Set(children.map(child => child.anganwadiCenter))];
    console.log('\n=== CENTER VARIATIONS ===');
    uniqueCenters.forEach(center => {
      console.log(`- '${center}'`);
    });
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkUserAndChildData();