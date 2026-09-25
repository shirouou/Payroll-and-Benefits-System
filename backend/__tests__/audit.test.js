/**
 * Audit Routes Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

describe('Audit Routes', () => {
  let adminToken;
  let hrToken;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    await User.deleteMany({});
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});

    await User.create({
      name: 'Admin User',
      email: 'admin.audit.test@example.com',
      password: 'AdminPass123!',
      role: 'admin',
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.audit.test@example.com', password: 'AdminPass123!' });
    adminToken = adminLogin.body.token;

    await User.create({
      name: 'HR User',
      email: 'hr.audit.test@example.com',
      password: 'HrPass123!',
      role: 'hr',
    });
    const hrLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'hr.audit.test@example.com', password: 'HrPass123!' });
    hrToken = hrLogin.body.token;
  });

  describe('GET /api/audit', () => {
    it('allows an admin to read the audit log', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('blocks an hr role from reading the audit log', async () => {
      const response = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${hrToken}`);

      expect(response.status).toBe(403);
    });

    it('rejects requests without a token', async () => {
      const response = await request(app).get('/api/audit');

      expect(response.status).toBe(401);
    });
  });
});
