/**
 * Copilot (NLP) Routes Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');

const validEmployeePayload = () => ({
  name: 'Copilot Test Employee',
  email: `copilot.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`,
  position: 'Concierge',
  department: 'Front Office',
  basicSalary: 23000,
  dateHired: '2024-01-15',
});

describe('Copilot Routes', () => {
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
      email: 'admin.copilot.test@example.com',
      password: 'AdminPass123!',
      role: 'admin',
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.copilot.test@example.com', password: 'AdminPass123!' });
    adminToken = adminLogin.body.token;

    const linkedEmployee = await Employee.create(validEmployeePayload());

    await User.create({
      name: 'Employee User',
      email: 'employee.copilot.test@example.com',
      password: 'EmployeePass123!',
      role: 'employee',
      employeeId: linkedEmployee._id,
    });
    const employeeLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee.copilot.test@example.com', password: 'EmployeePass123!' });
    employeeToken = employeeLogin.body.token;
  });

  describe('POST /api/copilot/query', () => {
    it('answers a payroll summary question with the correct record count', async () => {
      const employee = await Employee.create(validEmployeePayload());
      await Payroll.create({
        employeeId: employee._id,
        paymentPeriod: '2026-09',
        basicSalary: employee.basicSalary,
        grossSalary: employee.basicSalary,
        netPay: employee.basicSalary,
      });

      const response = await request(app)
        .post('/api/copilot/query')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'What is our total payroll net pay?' });

      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('payroll_summary');
      expect(response.body.answer).toContain('1 payroll record');
      expect(['rule-based', 'llm']).toContain(response.body.source);
    });

    it('answers an employee headcount question', async () => {
      await Employee.create(validEmployeePayload());
      await Employee.create(validEmployeePayload());

      const response = await request(app)
        .post('/api/copilot/query')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'How many employees do we have?' });

      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('employee_lookup');
      expect(response.body.answer).toContain('3 employee');
    });

    it('returns compliance findings for a compliance question', async () => {
      const employee = await Employee.create(validEmployeePayload());
      await Payroll.create({
        employeeId: employee._id,
        paymentPeriod: '2026-09',
        basicSalary: employee.basicSalary,
        grossSalary: employee.basicSalary,
        netPay: employee.basicSalary,
        status: 'Draft',
      });

      const response = await request(app)
        .post('/api/copilot/query')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Any compliance issues?' });

      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('compliance_check');
      expect(Array.isArray(response.body.findings)).toBe(true);
      expect(response.body.findings.length).toBeGreaterThan(0);
    });

    it('rejects an empty question', async () => {
      const response = await request(app)
        .post('/api/copilot/query')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: '   ' });

      expect(response.status).toBe(400);
    });

    it('allows an employee role to use the copilot', async () => {
      const response = await request(app)
        .post('/api/copilot/query')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ question: 'How many employees do we have?' });

      expect(response.status).toBe(200);
      expect(response.body.intent).toBe('employee_lookup');
    });
  });

  describe('GET /api/copilot/history', () => {
    it('stores and returns the user chat history', async () => {
      const first = await request(app)
        .post('/api/copilot/query')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'How many employees do we have?' });

      expect(first.status).toBe(200);
      expect(first.body.source).toBeTruthy();

      const history = await request(app)
        .get('/api/copilot/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(history.status).toBe(200);
      expect(Array.isArray(history.body.data)).toBe(true);
      expect(history.body.data.some(item => item.role === 'user')).toBe(true);
      expect(history.body.data.some(item => item.role === 'assistant')).toBe(true);
    });

    it('clears the user chat history', async () => {
      await request(app)
        .post('/api/copilot/query')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'How many employees do we have?' });

      const cleared = await request(app)
        .delete('/api/copilot/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(cleared.status).toBe(200);
      expect(cleared.body.success).toBe(true);

      const history = await request(app)
        .get('/api/copilot/history')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(history.status).toBe(200);
      expect(history.body.data).toEqual([]);
    });
  });

  describe('GET /api/copilot/compliance', () => {
    it('returns an empty findings array when nothing is wrong', async () => {
      const response = await request(app)
        .get('/api/copilot/compliance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('flags a payroll record with days worked exceeding working days', async () => {
      const employee = await Employee.create(validEmployeePayload());
      await Payroll.create({
        employeeId: employee._id,
        paymentPeriod: '2026-09',
        basicSalary: employee.basicSalary,
        grossSalary: employee.basicSalary,
        netPay: employee.basicSalary,
        workingDays: 22,
        daysWorked: 25,
      });

      const response = await request(app)
        .get('/api/copilot/compliance')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.some(finding => finding.rule === 'ATTENDANCE_RANGE')).toBe(true);
    });
  });
});
