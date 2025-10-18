// reset-admin-password.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Use the provided MongoDB Atlas connection string
const MONGODB_URI = 'mongodb+srv://sampoornaadmin:qiEbNqkB6fhm-2G@cluster0.8tilqvr.mongodb.net/sampoornaangan?retryWrites=true&w=majority&appName=Cluster0';

// The admin email to reset
const ADMIN_EMAIL = 'admin@sampoornaangan.gov.in';
// The new password you want to set
const NEW_PASSWORD = 'admin123';

// Import Admin model (adjust path if needed)
const Admin = require('./models/Admin');

async function resetPassword() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const hash = await bcrypt.hash(NEW_PASSWORD, 12);

  const result = await Admin.findOneAndUpdate(
    { email: ADMIN_EMAIL },
    { password: hash },
    { new: true }
  );

  if (result) {
    console.log('✅ Admin password reset successfully!');
  } else {
    console.log('❌ Admin not found.');
  }
  mongoose.disconnect();
}

resetPassword();
