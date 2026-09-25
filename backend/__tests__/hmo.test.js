/**
 * HMO Routes Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');
const HMOPlan = require('../models/HMOPlan');
const HMOEnrollment = require('../models/HMOEnrollment');

const validPlanPayload = () => ({
  name: `Gold Plan ${Date.now()}.${Math.random().toString(36).slice(2)}`,
  description: 'Comprehensive coverage',
  coverage: 150000,
  premium: 750,
});

const validEmployeePayload = () => ({
  name: 'HMO Test Employee',
  email: `hmo.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`,
  position: 'Chef',
  department: 'Kitchen',
  basicSalary: 24000,
  dateHired: '2024-01-15',
});

describe('HMO Routes', () => {
  let adminToken;
  let employeeToken;

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
    await Employee.deleteMany({});
    await HMOPlan.deleteMany({});
    await HMOEnrollment.deleteMany({});
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Employee.deleteMany({});
    await HMOPlan.deleteMany({});
    await HMOEnrollment.deleteMany({});

    await User.create({
      name: 'Admin User',
      email: 'admin.hmo.test@example.com',
      password: 'AdminPass123!',
      role: 'admin',
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.hmo.test@example.com', password: 'AdminPass123!' });
    adminToken = adminLogin.body.token;

    await User.create({
      name: 'Employee User',
      email: 'employee.hmo.test@example.com',
      password: 'EmployeePass123!',
      role: 'employee',
    });
    const employeeLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee.hmo.test@example.com', password: 'EmployeePass123!' });
    employeeToken = employeeLogin.body.token;
  });

  describe('POST /api/hmo/plans', () => {
    it('allows an admin to create an HMO plan', async () => {
      const response = await request(app)
        .post('/api/hmo/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validPlanPayload());

      expect(response.status).toBe(201);
      expect(response.body.data.coverage).toBe(150000);
    });

    it('rejects a plan missing required fields', async () => {
      const response = await request(app)
        .post('/api/hmo/plans')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Missing coverage and premium' });

      expect(response.status).toBe(400);
    });

    it('blocks an employee role from creating plans', async () => {
      const response = await request(app)
        .post('/api/hmo/plans')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(validPlanPayload());

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/hmo/plans', () => {
    it('returns all HMO plans', async () => {
      await HMOPlan.create(validPlanPayload());
      await HMOPlan.create(validPlanPayload());

      const response = await request(app)
        .get('/api/hmo/plans')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('PUT /api/hmo/plans/:id', () => {
    it('updates a plan', async () => {
      const plan = await HMOPlan.create(validPlanPayload());

      const response = await request(app)
        .put(`/api/hmo/plans/${plan._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ premium: 900 });

      expect(response.status).toBe(200);
      expect(response.body.data.premium).toBe(900);
    });
  });

  describe('DELETE /api/hmo/plans/:id', () => {
    it('deletes a plan', async () => {
      const plan = await HMOPlan.create(validPlanPayload());

      const response = await request(app)
        .delete(`/api/hmo/plans/${plan._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const stillExists = await HMOPlan.findById(plan._id);
      expect(stillExists).toBeNull();
    });
  });

  describe('POST /api/hmo/enrollments', () => {
    it('enrolls an employee in a plan', async () => {
      const employee = await Employee.create(validEmployeePayload());
      const plan = await HMOPlan.create(validPlanPayload());

      const response = await request(app)
        .post('/api/hmo/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: employee._id,
          planId: plan._id,
          dateEnrolled: '2026-09-01',
        });

      expect(response.status).toBe(201);
      expect(String(response.body.data.employeeId._id)).toBe(String(employee._id));
      expect(response.body.data.status).toBe('Active');
    });

    it('blocks an employee role from creating enrollments', async () => {
      const employee = await Employee.create(validEmployeePayload());
      const plan = await HMOPlan.create(validPlanPayload());

      const response = await request(app)
        .post('/api/hmo/enrollments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ employeeId: employee._id, planId: plan._id, dateEnrolled: '2026-09-01' });

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/hmo/enrollments/employee/:employeeId', () => {
    it('returns only the enrollments for the given employee', async () => {
      const employeeA = await Employee.create(validEmployeePayload());
      const employeeB = await Employee.create(validEmployeePayload());
      const plan = await HMOPlan.create(validPlanPayload());

      await HMOEnrollment.create({ employeeId: employeeA._id, planId: plan._id, dateEnrolled: '2026-09-01' });
      await HMOEnrollment.create({ employeeId: employeeB._id, planId: plan._id, dateEnrolled: '2026-09-01' });

      const response = await request(app)
        .get(`/api/hmo/enrollments/employee/${employeeA._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
    });
  });
});
