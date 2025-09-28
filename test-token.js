require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const jwt = require('jsonwebtoken');

async function checkAdmins() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sampoornaangan');
    const admins = await Admin.find({}).select('email username isActive');
    console.log('Found admins:', admins.length);
    
    if (admins.length > 0) {
      const admin = admins[0];
      console.log(`- ${admin.email} (${admin.username}) - Active: ${admin.isActive}`);
      
      // Generate a test token
      const token = jwt.sign(
        { id: admin._id },
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );
      
      console.log('\n🔑 Test Token (copy this for browser localStorage):');
      console.log(token);
      console.log('\n📝 To use this token:');
      console.log('1. Open browser console on frontend');
      console.log('2. Run: localStorage.setItem("adminToken", "' + token + '")');
      console.log('3. Refresh the page and try the attendance feature');
    } else {
      console.log('No admins found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkAdmins();