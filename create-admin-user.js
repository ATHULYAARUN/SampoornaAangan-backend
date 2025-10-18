// create-admin-user.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb+srv://sampoornaadmin:qiEbNqkB6fhm-2G@cluster0.8tilqvr.mongodb.net/sampoornaangan?retryWrites=true&w=majority&appName=Cluster0';

const Admin = require('./models/Admin');

async function createAdmin() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const email = 'admin@angan.com';
  const username = 'admin';
  const password = 'admin';
  const name = 'New Admin';

  const existing = await Admin.findOne({ $or: [ { email }, { username } ] });
  if (existing) {
    console.log('❌ Admin with this email or username already exists.');
    mongoose.disconnect();
    return;
  }

  const hash = await bcrypt.hash(password, 12);

  const admin = new Admin({
    email,
    username,
    password: hash,
    name,
    role: 'super-admin',
    isActive: true,
    isVerified: true
  });

  await admin.save();
  console.log('✅ New admin created:', { email, username, password });
  mongoose.disconnect();
}

createAdmin();
