/**
 * Test script to verify email functionality for worker creation
 * This script tests the sendWorkerWelcomeEmail function without needing MongoDB
 */

require('dotenv').config();
const emailService = require('./services/emailService');

// Mock user data for testing
const mockUser = {
  name: 'Test Worker',
  email: 'test.worker@example.com', // Change this to a real email for testing
  role: 'anganwadi-worker'
};

const mockPassword = 'TestPass123';

// Helper function to send welcome email (same as in admin.js)
const sendWorkerWelcomeEmail = async (user, tempPassword) => {
  const loginUrl = `https://sampoornaangan.com/login`;
  
  // Create both HTML and text versions for better compatibility
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to SampoornaAangan</h1>
        <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Your Worker Account</p>
      </div>
      
      <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
        <h2 style="color: #333; margin-top: 0;">Dear ${user.name},</h2>
        
        <p style="color: #666; line-height: 1.6;">
          Your worker account for SampoornaAangan has been created successfully.<br>
          You can log in using the following credentials:
        </p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #333; margin-top: 0;">Login Credentials:</h3>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${user.email}</p>
          <p style="margin: 8px 0;"><strong>Password:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace; font-size: 14px;">${tempPassword}</code></p>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Please log in at: <a href="${loginUrl}" style="color: #667eea; text-decoration: none; font-weight: bold;">${loginUrl}</a> and change your password after first login.
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Login to Portal
          </a>
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">🔐 Important Security Notice:</h4>
          <ul style="color: #856404; margin: 0; padding-left: 20px;">
            <li>This is a temporary password for your first login</li>
            <li>You must change your password after first login</li>
            <li>Please keep your credentials confidential</li>
            <li>Contact your administrator if you face any issues</li>
          </ul>
        </div>
        
        <p style="color: #666; line-height: 1.6;">
          Once you log in, you'll have access to your dashboard where you can:
        </p>
        
        <ul style="color: #666; line-height: 1.6;">
          ${user.role === 'anganwadi-worker' ? `
            <li>Record child health statistics and growth data</li>
            <li>Track attendance and nutrition programs</li>
            <li>Manage beneficiary information</li>
          ` : user.role === 'asha-volunteer' ? `
            <li>Update maternal care visit records</li>
            <li>Record health screening information</li>
            <li>Track community health programs</li>
          ` : `
            <li>Report hygiene activities and maintenance</li>
            <li>Track sanitation facility status</li>
            <li>Submit maintenance requests</li>
          `}
        </ul>
        
        <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
        
        <p style="color: #666; line-height: 1.6;">
          Regards,<br>
          <strong>SampoornaAangan Admin Team</strong>
        </p>
        
        <p style="color: #999; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
          This email was sent by SampoornaAangan Portal<br>
          If you have any questions, please contact your administrator.
        </p>
      </div>
    </div>
  `;

  // Plain text version for better email client compatibility
  const textContent = `
Dear ${user.name},

Your worker account for SampoornaAangan has been created successfully.
You can log in using the following credentials:

Email: ${user.email}
Password: ${tempPassword}

Please log in at: ${loginUrl} and change your password after first login.

IMPORTANT SECURITY NOTICE:
- This is a temporary password for your first login
- You must change your password after first login
- Please keep your credentials confidential
- Contact your administrator if you face any issues

Once you log in, you'll have access to your dashboard where you can manage your assigned responsibilities.

Regards,
SampoornaAangan Admin Team

---
This email was sent by SampoornaAangan Portal
If you have any questions, please contact your administrator.
  `;
  
  // Use existing email service
  return await emailService.sendEmail({
    to: user.email,
    subject: 'Welcome to SampoornaAangan – Your Worker Account',
    html: emailContent,
    text: textContent
  });
};

async function testEmailFunctionality() {
  console.log('🧪 Testing Email Functionality for Worker Creation...\n');
  
  console.log('📧 Email Configuration:');
  console.log('- EMAIL_USER:', process.env.EMAIL_USER ? 'Set ✓' : 'Not Set ✗');
  console.log('- EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set ✓' : 'Not Set ✗');
  console.log('- EMAIL_FROM:', process.env.EMAIL_FROM || 'Using default');
  console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Using default');
  console.log();
  
  // Test email service connection
  console.log('🔧 Testing email service connection...');
  try {
    const connectionTest = await emailService.testConnection();
    console.log('Connection Result:', connectionTest);
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return;
  }
  
  console.log('\n📤 Sending test worker welcome email...');
  console.log('Mock User:', mockUser);
  console.log('Mock Password:', mockPassword);
  console.log();
  
  try {
    const result = await sendWorkerWelcomeEmail(mockUser, mockPassword);
    console.log('✅ Email sent successfully!');
    console.log('Email Result:', result);
    console.log('\n📋 Email Details:');
    console.log('- Subject: "Welcome to SampoornaAangan – Your Worker Account"');
    console.log('- Recipient:', mockUser.email);
    console.log('- Login URL: https://sampoornaangan.com/login');
    console.log('- Password included: Yes');
    console.log('- HTML format: Yes');
    console.log('- Text format: Yes');
    
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
if (require.main === module) {
  testEmailFunctionality()
    .then(() => {
      console.log('\n🏁 Email test completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmailFunctionality, sendWorkerWelcomeEmail };