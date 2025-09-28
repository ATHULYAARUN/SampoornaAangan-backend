const mongoose = require('mongoose');
require('dotenv').config();

const clearAnganwadiCenters = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get the collection
    const db = mongoose.connection.db;
    const collection = db.collection('anganwadicenters');
    
    // Drop the collection to clear all data and indexes
    try {
      await collection.drop();
      console.log('Dropped anganwadicenters collection');
    } catch (error) {
      if (error.code === 26) {
        console.log('Collection does not exist, continuing...');
      } else {
        throw error;
      }
    }

    console.log('✅ Database cleared successfully!');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
if (require.main === module) {
  clearAnganwadiCenters();
}

module.exports = clearAnganwadiCenters;