/**
 * Payroll Routes Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');

const validEmployeePayload = (overrides = {}) => ({
  name: 'Payroll Test Employee',
  email: `payroll.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`,
  position: 'Housekeeping Staff',
  department: 'Housekeeping',
  basicSalary: 22000,
  dateHired: '2024-01-15',
  status: 'Active',
  ...overrides,
});

describe('Payroll Routes', () => {
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
    await Payroll.deleteMany({});
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Employee.deleteMany({});
    await Payroll.deleteMany({});

    await User.create({
      name: 'Admin User',
      email: 'admin.payroll.test@example.com',
      password: 'AdminPass123!',
      role: 'admin',
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.payroll.test@example.com', password: 'AdminPass123!' });
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

  describe('POST /api/payroll', () => {
    it('creates a payroll record with correctly calculated gross and net pay', async () => {
      const employee = await Employee.create(validEmployeePayload());

      const response = await request(app)
        .post('/api/payroll')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: employee._id,
          paymentPeriod: '2026-09',
          basicSalary: employee.basicSalary,
          workingDays: 22,
          daysWorked: 22,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.grossSalary).toBe(22000);
      expect(response.body.data.netPay).toBeLessThan(response.body.data.grossSalary);
      expect(response.body.data.netPay).toBeGreaterThan(0);
      expect(response.body.data.deductions.length).toBeGreaterThanOrEqual(4);
    });

    it('rejects days worked greater than working days', async () => {
      const employee = await Employee.create(validEmployeePayload());

      const response = await request(app)
        .post('/api/payroll')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: employee._id,
          paymentPeriod: '2026-09',
          basicSalary: employee.basicSalary,
          workingDays: 22,
          daysWorked: 30,
        });

      expect(response.status).toBe(400);
    });

    it('blocks an employee role from creating payroll records', async () => {
      const employee = await Employee.create(validEmployeePayload());
      const employeeToken = await loginAsEmployee(employee);

      const response = await request(app)
        .post('/api/payroll')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId: employee._id,
          paymentPeriod: '2026-09',
          basicSalary: employee.basicSalary,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('cannot create payroll');
    });
  });

  describe('GET /api/payroll', () => {
    it('scopes results to only the logged-in employee\'s own records', async () => {
      const employeeA = await Employee.create(validEmployeePayload());
      const employeeB = await Employee.create(validEmployeePayload());

      await Payroll.create({
        employeeId: employeeA._id,
        paymentPeriod: '2026-09',
        basicSalary: employeeA.basicSalary,
        grossSalary: employeeA.basicSalary,
        netPay: employeeA.basicSalary,
      });
      await Payroll.create({
        employeeId: employeeB._id,
        paymentPeriod: '2026-09',
        basicSalary: employeeB.basicSalary,
        grossSalary: employeeB.basicSalary,
        netPay: employeeB.basicSalary,
      });

      const employeeAToken = await loginAsEmployee(employeeA);

      const response = await request(app)
        .get('/api/payroll')
        .set('Authorization', `Bearer ${employeeAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(String(response.body.data[0].employeeId._id)).toBe(String(employeeA._id));
    });

    it('returns all records for an admin', async () => {
      const employeeA = await Employee.create(validEmployeePayload());
      const employeeB = await Employee.create(validEmployeePayload());

      await Payroll.create({
        employeeId: employeeA._id,
        paymentPeriod: '2026-09',
        basicSalary: employeeA.basicSalary,
        grossSalary: employeeA.basicSalary,
        netPay: employeeA.basicSalary,
      });
      await Payroll.create({
        employeeId: employeeB._id,
        paymentPeriod: '2026-09',
        basicSalary: employeeB.basicSalary,
        grossSalary: employeeB.basicSalary,
        netPay: employeeB.basicSalary,
      });

      const response = await request(app)
        .get('/api/payroll')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });
  });

  describe('POST /api/payroll/run/batch', () => {
    it('generates a payroll record for every active employee', async () => {
      await Employee.create(validEmployeePayload({ status: 'Active' }));
      await Employee.create(validEmployeePayload({ status: 'Active' }));
      await Employee.create(validEmployeePayload({ status: 'Inactive' }));

      const response = await request(app)
        .post('/api/payroll/run/batch')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentPeriod: '2026-09' });

      expect(response.status).toBe(201);
      expect(response.body.data.length).toBe(2);

      const recordsInDb = await Payroll.find({ paymentPeriod: '2026-09' });
      expect(recordsInDb.length).toBe(2);
    });

    it('blocks an employee role from running batch payroll', async () => {
      const employee = await Employee.create(validEmployeePayload());
      const employeeToken = await loginAsEmployee(employee);

      const response = await request(app)
        .post('/api/payroll/run/batch')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ paymentPeriod: '2026-09' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('cannot run payroll');
    });
  });

  describe('DELETE /api/payroll/:id', () => {
    it('deletes a payroll record', async () => {
      const employee = await Employee.create(validEmployeePayload());
      const payroll = await Payroll.create({
        employeeId: employee._id,
        paymentPeriod: '2026-09',
        basicSalary: employee.basicSalary,
        grossSalary: employee.basicSalary,
        netPay: employee.basicSalary,
      });

      const response = await request(app)
        .delete(`/api/payroll/${payroll._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const stillExists = await Payroll.findById(payroll._id);
      expect(stillExists).toBeNull();
    });
  });
});
