/**
 * Claims Routes Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');
const HMOPlan = require('../models/HMOPlan');
const HMOEnrollment = require('../models/HMOEnrollment');
const Claim = require('../models/Claim');

const validEmployeePayload = (overrides = {}) => ({
  name: 'Claims Test Employee',
  email: `claims.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`,
  position: 'Waitstaff',
  department: 'Dining',
  basicSalary: 21000,
  dateHired: '2024-01-15',
  status: 'Active',
  ...overrides,
});

describe('Claims Routes', () => {
  let adminToken;

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
    await Claim.deleteMany({});
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Employee.deleteMany({});
    await HMOPlan.deleteMany({});
    await HMOEnrollment.deleteMany({});
    await Claim.deleteMany({});

    await User.create({
      name: 'Admin User',
      email: 'admin.claims.test@example.com',
      password: 'AdminPass123!',
      role: 'admin',
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.claims.test@example.com', password: 'AdminPass123!' });
    adminToken = adminLogin.body.token;
  });

  const loginAsEmployee = async (employee) => {
    await User.create({
      name: employee.name,
      email: employee.email,
      password: 'EmployeePass123!',
      role: 'employee',
      employeeId: employee._id,
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: employee.email, password: 'EmployeePass123!' });
    return login.body.token;
  };

  const createActiveEnrollment = async (employeeId) => {
    const plan = await HMOPlan.create({
      name: `Plan ${Date.now()}.${Math.random().toString(36).slice(2)}`,
      coverage: 100000,
      premium: 500,
    });
    return HMOEnrollment.create({
      employeeId,
      planId: plan._id,
      dateEnrolled: '2024-01-15',
      status: 'Active',
    });
  };

  const claimPayload = (enrollmentId) => ({
    enrollmentId,
    claimDate: '2026-09-01',
    serviceDate: '2026-08-28',
    provider: 'City General Hospital',
    description: 'Annual physical exam',
    claimAmount: 3500,
  });

  describe('POST /api/claims', () => {
    it('allows an employee to submit a claim against their own active enrollment', async () => {
      const employee = await Employee.create(validEmployeePayload());
      const enrollment = await createActiveEnrollment(employee._id);
      const employeeToken = await loginAsEmployee(employee);

      const response = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(claimPayload(enrollment._id));

      expect(response.status).toBe(201);
      expect(response.body.data.status).toBe('Pending');
      expect(String(response.body.data.employeeId._id)).toBe(String(employee._id));
    });

    it('blocks an employee from submitting a claim against another employee\'s enrollment', async () => {
      const employeeA = await Employee.create(validEmployeePayload());
      const employeeB = await Employee.create(validEmployeePayload());
      const enrollmentB = await createActiveEnrollment(employeeB._id);
      const employeeAToken = await loginAsEmployee(employeeA);

      const response = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${employeeAToken}`)
        .send(claimPayload(enrollmentB._id));

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('active enrollment');
    });

    it('rejects a claim with missing required fields', async () => {
      const employee = await Employee.create(validEmployeePayload());
      const enrollment = await createActiveEnrollment(employee._id);
      const employeeToken = await loginAsEmployee(employee);

      const response = await request(app)
        .post('/api/claims')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ enrollmentId: enrollment._id });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/claims', () => {
    it('scopes results to only the logged-in employee\'s own claims', async () => {
      const employeeA = await Employee.create(validEmployeePayload());
      const employeeB = await Employee.create(validEmployeePayload());
      const enrollmentA = await createActiveEnrollment(employeeA._id);
      const enrollmentB = await createActiveEnrollment(employeeB._id);

      await Claim.create({ ...claimPayload(enrollmentA._id), employeeId: employeeA._id });
      await Claim.create({ ...claimPayload(enrollmentB._id), employeeId: employeeB._id });

      const employeeAToken = await loginAsEmployee(employeeA);

      const response = await request(app)
        .get('/api/claims')
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(String(response.body.data[0].employeeId._id)).toBe(String(employeeA._id));
    });
  });

  describe('POST /api/claims/:id/approve', () => {
    it('allows an admin to approve a claim', async () => {
      const employee = await Employee.create(validEmployeePayload());
      const enrollment = await createActiveEnrollment(employee._id);
      const claim = await Claim.create({ ...claimPayload(enrollment._id), employeeId: employee._id });

      const response = await request(app)
        .post(`/api/claims/${claim._id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ approvedAmount: 3000 });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('Approved');
      expect(response.body.data.approvedAmount).toBe(3000);
    });

    it('blocks an employee role from approving claims', async () => {
      const employee = await Employee.create(validEmployeePayload());
      const enrollment = await createActiveEnrollment(employee._id);
      const claim = await Claim.create({ ...claimPayload(enrollment._id), employeeId: employee._id });
      const employeeToken = await loginAsEmployee(employee);

      const response = await request(app)
        .post(`/api/claims/${claim._id}/approve`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ approvedAmount: 3000 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Only administrators or HR');
    });
  });

  describe('POST /api/claims/:id/reject', () => {
    it('allows an admin to reject a claim', async () => {
      const employee = await Employee.create(validEmployeePayload());
      const enrollment = await createActiveEnrollment(employee._id);
      const claim = await Claim.create({ ...claimPayload(enrollment._id), employeeId: employee._id });

      const response = await request(app)
        .post(`/api/claims/${claim._id}/reject`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'Not covered under plan' });

      expect(response.status).toBe(200);
      expect(response.body.data.status).toBe('Rejected');
    });
  });
});
