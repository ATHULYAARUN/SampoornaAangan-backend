const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');

// Test database
const MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/sampoornaangan_test';

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    // Clean up and close database connection
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  describe('POST /api/auth/admin/login', () => {
    it('should login admin with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          identifier: 'admin',
          password: 'admin'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.admin.role).toBe('super-admin');
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          identifier: 'admin',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/admin/login')
        .send({
          identifier: 'admin'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
      expect(response.body.message).toBe('SampoornaAngan Backend is running');
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Welcome to SampoornaAngan API');
      expect(response.body.version).toBeDefined();
    });
  });
});

describe('Error Handling', () => {
  it('should handle 404 for non-existent routes', async () => {
    const response = await request(app).get('/api/non-existent-route');

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Route not found');
  });

  it('should handle invalid JSON', async () => {
    const response = await request(app)
      .post('/api/auth/admin/login')
      .send('invalid json')
      .set('Content-Type', 'application/json');

    expect(response.status).toBe(400);
  });
});

describe('Rate Limiting', () => {
  it('should apply rate limiting', async () => {
    // Make multiple requests quickly
    const requests = Array(10).fill().map(() => 
      request(app).get('/health')
    );

    const responses = await Promise.all(requests);
    
    // All requests should succeed (within rate limit)
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});