const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Child = require('../models/Child');
const PregnantWoman = require('../models/PregnantWoman');
const Adolescent = require('../models/Adolescent');
const jwt = require('jsonwebtoken');

// Test database
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sampoornaangan_test';

describe('Admin Dashboard Endpoints', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create admin user
    adminUser = new User({
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'super-admin',
      firstName: 'Admin',
      lastName: 'User',
      isActive: true
    });
    await adminUser.save();

    // Generate admin token
    adminToken = jwt.sign(
      { userId: adminUser._id, role: 'super-admin' },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up and close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Promise.all([
      User.deleteMany({ _id: { $ne: adminUser._id } }),
      Child.deleteMany({}),
      PregnantWoman.deleteMany({}),
      Adolescent.deleteMany({})
    ]);
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return dashboard data with correct center codes', async () => {
      // Create test data for Akkarakunnu Center
      await Promise.all([
        new User({
          email: 'worker1@akkarakunnu.com',
          password: 'hashedpassword',
          role: 'anganwadi-worker',
          firstName: 'Worker',
          lastName: 'One',
          isActive: true,
          roleSpecificData: {
            anganwadiCenter: {
              name: 'Akkarakunnu Anganwadi Center'
            }
          }
        }).save(),
        new Child({
          name: 'Child One',
          anganwadiCenter: 'Akkarakunnu Anganwadi Center',
          status: 'active',
          dateOfBirth: new Date('2020-01-01')
        }).save(),
        new Child({
          name: 'Child Two',
          anganwadiCenter: 'Akkarakunnu Anganwadi Center',
          status: 'active',
          dateOfBirth: new Date('2021-01-01')
        }).save()
      ]);

      // Create test data for Veliyanoor Center
      await Promise.all([
        new User({
          email: 'worker1@veliyanoor.com',
          password: 'hashedpassword',
          role: 'anganwadi-worker',
          firstName: 'Worker',
          lastName: 'Two',
          isActive: true,
          roleSpecificData: {
            anganwadiCenter: {
              name: 'Veliyanoor Anganwadi Center'
            }
          }
        }).save(),
        new Child({
          name: 'Child Three',
          anganwadiCenter: 'Veliyanoor Anganwadi Center',
          status: 'active',
          dateOfBirth: new Date('2020-06-01')
        }).save()
      ]);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const { data } = response.body;

      // Check basic stats
      expect(data.totalUsers).toBeDefined();
      expect(data.totalChildren).toBe(3); // 2 from Akkarakunnu + 1 from Veliyanoor

      // Check center statistics with correct codes
      expect(data.centerStats).toHaveLength(2);

      // Akkarakunnu Center
      const akkarankunnuCenter = data.centerStats.find(center => center.code === 'AW-AK968');
      expect(akkarankunnuCenter).toBeDefined();
      expect(akkarankunnuCenter.name).toBe('Akkarakunnu Anganwadi Center');
      expect(akkarankunnuCenter.children).toBe(2);
      expect(akkarankunnuCenter.workers).toBe(1);

      // Veliyanoor Center
      const veliyanoorCenter = data.centerStats.find(center => center.code === 'AK-VL969');
      expect(veliyanoorCenter).toBeDefined();
      expect(veliyanoorCenter.name).toBe('Veliyanoor Anganwadi Center');
      expect(veliyanoorCenter.children).toBe(1);
      expect(veliyanoorCenter.workers).toBe(1);
    });

    it('should return zero counts for centers with no data', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const { data } = response.body;

      // Both centers should still be present with zero counts
      expect(data.centerStats).toHaveLength(2);

      const akkarankunnuCenter = data.centerStats.find(center => center.code === 'AW-AK968');
      expect(akkarankunnuCenter.children).toBe(0);
      expect(akkarankunnuCenter.workers).toBe(0);

      const veliyanoorCenter = data.centerStats.find(center => center.code === 'AK-VL969');
      expect(veliyanoorCenter.children).toBe(0);
      expect(veliyanoorCenter.workers).toBe(0);
    });

    it('should require admin authentication', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-admin users', async () => {
      // Create regular user
      const regularUser = new User({
        email: 'user@test.com',
        password: 'hashedpassword',
        role: 'anganwadi-worker',
        firstName: 'Regular',
        lastName: 'User',
        isActive: true
      });
      await regularUser.save();

      const userToken = jwt.sign(
        { userId: regularUser._id, role: 'anganwadi-worker' },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should include health alerts in response', async () => {
      // Create high-risk pregnant woman
      await new PregnantWoman({
        name: 'High Risk Woman',
        anganwadiCenter: 'Akkarakunnu Anganwadi Center',
        status: 'active',
        isHighRisk: true,
        gestationalAge: 30
      }).save();

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const { data } = response.body;
      expect(data.healthAlerts).toBeDefined();
      expect(typeof data.healthAlerts).toBe('number');
    });

    it('should handle database errors gracefully', async () => {
      // Mock a database error by closing connection temporarily
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);

      // Reconnect for other tests
      await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    });
  });

  describe('Center Code Validation', () => {
    it('should have correct center codes in response', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const { data } = response.body;

      // Verify exact center codes
      const centerCodes = data.centerStats.map(center => center.code);
      expect(centerCodes).toContain('AW-AK968');
      expect(centerCodes).toContain('AK-VL969');
      expect(centerCodes).toHaveLength(2);
    });

    it('should maintain center code consistency across requests', async () => {
      // Make multiple requests
      const responses = await Promise.all([
        request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`),
        request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${adminToken}`)
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        const centerCodes = response.body.data.centerStats.map(center => center.code);
        expect(centerCodes).toEqual(['AW-AK968', 'AK-VL969']);
      });
    });
  });

  describe('Data Integration', () => {
    it('should accurately count resources per center', async () => {
      // Add mixed data across centers
      await Promise.all([
        // Akkarakunnu data
        new Child({
          name: 'Child A1',
          anganwadiCenter: 'Akkarakunnu Anganwadi Center',
          status: 'active',
          dateOfBirth: new Date('2020-01-01')
        }).save(),
        new Child({
          name: 'Child A2',
          anganwadiCenter: 'Akkarakunnu Anganwadi Center',
          status: 'active',
          dateOfBirth: new Date('2021-01-01')
        }).save(),
        new PregnantWoman({
          name: 'Pregnant A1',
          anganwadiCenter: 'Akkarakunnu Anganwadi Center',
          status: 'active',
          gestationalAge: 20
        }).save(),
        new Adolescent({
          name: 'Adolescent A1',
          anganwadiCenter: 'Akkarakunnu Anganwadi Center',
          status: 'active',
          age: 15
        }).save(),

        // Veliyanoor data
        new Child({
          name: 'Child V1',
          anganwadiCenter: 'Veliyanoor Anganwadi Center',
          status: 'active',
          dateOfBirth: new Date('2020-06-01')
        }).save(),
        new PregnantWoman({
          name: 'Pregnant V1',
          anganwadiCenter: 'Veliyanoor Anganwadi Center',
          status: 'active',
          gestationalAge: 25
        }).save(),
        new PregnantWoman({
          name: 'Pregnant V2',
          anganwadiCenter: 'Veliyanoor Anganwadi Center',
          status: 'active',
          gestationalAge: 30
        }).save()
      ]);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const { data } = response.body;

      const akkarankunnuCenter = data.centerStats.find(center => center.code === 'AW-AK968');
      expect(akkarankunnuCenter.children).toBe(2);
      expect(akkarankunnuCenter.pregnantWomen).toBe(1);
      expect(akkarankunnuCenter.adolescents).toBe(1);

      const veliyanoorCenter = data.centerStats.find(center => center.code === 'AK-VL969');
      expect(veliyanoorCenter.children).toBe(1);
      expect(veliyanoorCenter.pregnantWomen).toBe(2);
      expect(veliyanoorCenter.adolescents).toBe(0);
    });

    it('should only count active records', async () => {
      await Promise.all([
        // Active child
        new Child({
          name: 'Active Child',
          anganwadiCenter: 'Akkarakunnu Anganwadi Center',
          status: 'active',
          dateOfBirth: new Date('2020-01-01')
        }).save(),
        // Inactive child
        new Child({
          name: 'Inactive Child',
          anganwadiCenter: 'Akkarakunnu Anganwadi Center',
          status: 'inactive',
          dateOfBirth: new Date('2020-01-01')
        }).save()
      ]);

      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const { data } = response.body;

      const akkarankunnuCenter = data.centerStats.find(center => center.code === 'AW-AK968');
      expect(akkarankunnuCenter.children).toBe(1); // Only active child
    });
  });
});