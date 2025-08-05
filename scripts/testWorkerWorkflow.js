const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models and services
const User = require('../models/User');
const Admin = require('../models/Admin');
const emailService = require('../services/emailService');

// Test data
const testWorkerData = {
  name: 'Test Anganwadi Worker',
  email: 'test.worker@example.com',
  phone: '+919876543210',
  role: 'anganwadi-worker',
  address: {
    street: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    district: 'Test District',
    block: 'Test Block'
  },
  roleSpecificData: {
    anganwadiCenter: {
      name: 'Test Anganwadi Center',
      code: 'TAC001',
      district: 'Test District',
      block: 'Test Block'
    }
  }
};

const testAdminData = {
  name: 'Test Admin',
  email: 'test.admin@sampoornaangan.gov.in',
  username: 'testadmin',
  password: 'TestAdmin123!',
  role: 'super-admin',
  permissions: ['manage_users', 'manage_workers', 'view_reports', 'system_settings']
};

class WorkerWorkflowTester {
  constructor() {
    this.testResults = [];
    this.createdWorker = null;
    this.createdAdmin = null;
  }

  async connectDB() {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      return false;
    }
  }

  async cleanup() {
    try {
      // Clean up test data
      if (this.createdWorker) {
        await User.findByIdAndDelete(this.createdWorker._id);
        console.log('🧹 Cleaned up test worker');
      }
      
      if (this.createdAdmin) {
        await Admin.findByIdAndDelete(this.createdAdmin._id);
        console.log('🧹 Cleaned up test admin');
      }

      await mongoose.connection.close();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }

  logTest(testName, success, message, data = null) {
    const result = {
      test: testName,
      success,
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const icon = success ? '✅' : '❌';
    console.log(`${icon} ${testName}: ${message}`);
    
    if (data && success) {
      console.log(`   📊 Data:`, JSON.stringify(data, null, 2));
    }
  }

  async testStep1_AdminCreation() {
    try {
      // Check if admin already exists
      const existingAdmin = await Admin.findOne({ email: testAdminData.email });
      if (existingAdmin) {
        await Admin.findByIdAndDelete(existingAdmin._id);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(testAdminData.password, 12);

      // Create admin
      this.createdAdmin = new Admin({
        ...testAdminData,
        hashedPassword,
        isActive: true
      });

      await this.createdAdmin.save();

      this.logTest(
        'Step 1: Admin Creation',
        true,
        'Admin account created successfully',
        {
          adminId: this.createdAdmin._id,
          email: this.createdAdmin.email,
          role: this.createdAdmin.role
        }
      );

      return true;
    } catch (error) {
      this.logTest(
        'Step 1: Admin Creation',
        false,
        `Failed to create admin: ${error.message}`
      );
      return false;
    }
  }

  async testStep2_WorkerCreation() {
    try {
      // Check if worker already exists
      const existingWorker = await User.findOne({ email: testWorkerData.email });
      if (existingWorker) {
        await User.findByIdAndDelete(existingWorker._id);
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8) + 'A1!';

      // Create worker
      this.createdWorker = new User({
        ...testWorkerData,
        tempPassword,
        isActive: true,
        createdBy: this.createdAdmin._id
      });

      await this.createdWorker.save();

      this.logTest(
        'Step 2: Worker Account Creation',
        true,
        'Worker account created successfully',
        {
          workerId: this.createdWorker._id,
          email: this.createdWorker.email,
          role: this.createdWorker.role,
          tempPassword: tempPassword,
          hashedPassword: !!this.createdWorker.hashedPassword
        }
      );

      return { success: true, tempPassword };
    } catch (error) {
      this.logTest(
        'Step 2: Worker Account Creation',
        false,
        `Failed to create worker: ${error.message}`
      );
      return { success: false };
    }
  }

  async testStep3_EmailSending(tempPassword) {
    try {
      // Test email service configuration
      const connectionTest = await emailService.testConnection();
      
      if (!connectionTest.success) {
        this.logTest(
          'Step 3: Email Service Test',
          false,
          `Email service not configured: ${connectionTest.message}`
        );
        return false;
      }

      // Send credentials email (in production, this would be automatic)
      try {
        await emailService.sendCredentialsEmail(
          this.createdWorker.email,
          this.createdWorker.name,
          this.createdWorker.email,
          tempPassword
        );

        this.logTest(
          'Step 3: Credentials Email',
          true,
          'Credentials email sent successfully',
          {
            recipient: this.createdWorker.email,
            tempPassword: tempPassword
          }
        );

        return true;
      } catch (emailError) {
        this.logTest(
          'Step 3: Credentials Email',
          false,
          `Failed to send email: ${emailError.message}`
        );
        return false;
      }
    } catch (error) {
      this.logTest(
        'Step 3: Email Service Test',
        false,
        `Email service error: ${error.message}`
      );
      return false;
    }
  }

  async testStep4_LoginValidation(tempPassword) {
    try {
      // Simulate login attempt with temporary password
      const worker = await User.findOne({ email: testWorkerData.email });
      
      if (!worker) {
        throw new Error('Worker not found');
      }

      // Check temporary password
      const isValidTempPassword = worker.tempPassword === tempPassword;
      
      if (!isValidTempPassword) {
        throw new Error('Temporary password validation failed');
      }

      // Check if user needs password change
      const needsPasswordChange = !!worker.tempPassword;

      this.logTest(
        'Step 4: Login Validation',
        true,
        'Login validation successful',
        {
          email: worker.email,
          hasTempPassword: !!worker.tempPassword,
          hasHashedPassword: !!worker.hashedPassword,
          needsPasswordChange
        }
      );

      return { success: true, needsPasswordChange };
    } catch (error) {
      this.logTest(
        'Step 4: Login Validation',
        false,
        `Login validation failed: ${error.message}`
      );
      return { success: false };
    }
  }

  async testStep5_PasswordChange(tempPassword) {
    try {
      const newPassword = 'NewSecurePassword123!';
      
      // Get worker
      const worker = await User.findById(this.createdWorker._id);
      
      // Validate current (temporary) password
      if (worker.tempPassword !== tempPassword) {
        throw new Error('Current password validation failed');
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      worker.hashedPassword = hashedNewPassword;
      worker.tempPassword = null;
      await worker.save();

      // Verify password change
      const updatedWorker = await User.findById(this.createdWorker._id);
      const isNewPasswordValid = await bcrypt.compare(newPassword, updatedWorker.hashedPassword);

      if (!isNewPasswordValid) {
        throw new Error('New password verification failed');
      }

      this.logTest(
        'Step 5: Password Change',
        true,
        'Password changed successfully',
        {
          hasTempPassword: !!updatedWorker.tempPassword,
          hasHashedPassword: !!updatedWorker.hashedPassword,
          newPasswordValid: isNewPasswordValid
        }
      );

      return { success: true, newPassword };
    } catch (error) {
      this.logTest(
        'Step 5: Password Change',
        false,
        `Password change failed: ${error.message}`
      );
      return { success: false };
    }
  }

  async testStep6_PasswordReset() {
    try {
      const crypto = require('crypto');
      
      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Update worker with reset token
      const worker = await User.findById(this.createdWorker._id);
      worker.resetPasswordToken = resetToken;
      worker.resetPasswordExpires = resetTokenExpiry;
      await worker.save();

      // Test password reset email
      try {
        await emailService.sendPasswordResetEmail(
          worker.email,
          worker.name,
          resetToken
        );

        this.logTest(
          'Step 6: Password Reset',
          true,
          'Password reset process successful',
          {
            resetToken: resetToken.substring(0, 8) + '...',
            expiresAt: resetTokenExpiry.toISOString()
          }
        );

        return true;
      } catch (emailError) {
        this.logTest(
          'Step 6: Password Reset Email',
          false,
          `Failed to send reset email: ${emailError.message}`
        );
        return false;
      }
    } catch (error) {
      this.logTest(
        'Step 6: Password Reset',
        false,
        `Password reset failed: ${error.message}`
      );
      return false;
    }
  }

  async runCompleteTest() {
    console.log('🚀 Starting Worker Management Workflow Test\n');
    
    // Connect to database
    const dbConnected = await this.connectDB();
    if (!dbConnected) {
      console.log('❌ Test aborted due to database connection failure');
      return;
    }

    try {
      // Step 1: Create Admin
      const step1Success = await this.testStep1_AdminCreation();
      if (!step1Success) {
        console.log('❌ Test aborted at Step 1');
        return;
      }

      // Step 2: Create Worker
      const step2Result = await this.testStep2_WorkerCreation();
      if (!step2Result.success) {
        console.log('❌ Test aborted at Step 2');
        return;
      }

      // Step 3: Test Email Service
      const step3Success = await this.testStep3_EmailSending(step2Result.tempPassword);
      // Continue even if email fails (might not be configured in dev)

      // Step 4: Test Login Validation
      const step4Result = await this.testStep4_LoginValidation(step2Result.tempPassword);
      if (!step4Result.success) {
        console.log('❌ Test aborted at Step 4');
        return;
      }

      // Step 5: Test Password Change
      const step5Result = await this.testStep5_PasswordChange(step2Result.tempPassword);
      if (!step5Result.success) {
        console.log('❌ Test aborted at Step 5');
        return;
      }

      // Step 6: Test Password Reset
      await this.testStep6_PasswordReset();

      // Print summary
      this.printTestSummary();

    } catch (error) {
      console.error('❌ Test execution failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  printTestSummary() {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => console.log(`   - ${r.test}: ${r.message}`));
    }
    
    console.log('\n🎉 Worker Management Workflow Test Complete!');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  const tester = new WorkerWorkflowTester();
  tester.runCompleteTest().catch(console.error);
}

module.exports = WorkerWorkflowTester;