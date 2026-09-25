/**
 * Employee Routes Tests
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Employee = require('../models/Employee');

const validEmployeePayload = () => ({
  name: 'Jane Doe',
  email: `jane.${Date.now()}.${Math.random().toString(36).slice(2)}@example.com`,
  position: 'Front Desk Agent',
  department: 'Front Office',
  basicSalary: 25000,
  dateHired: '2024-01-15',
});

describe('Employee Routes', () => {
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
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Employee.deleteMany({});

    await User.create({
      name: 'Admin User',
      email: 'admin.employees.test@example.com',
      password: 'AdminPass123!',
      role: 'admin',
    });
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin.employees.test@example.com', password: 'AdminPass123!' });
    adminToken = adminLogin.body.token;

    await User.create({
      name: 'Employee User',
      email: 'employee.employees.test@example.com',
      password: 'EmployeePass123!',
      role: 'employee',
    });
    const employeeLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee.employees.test@example.com', password: 'EmployeePass123!' });
    employeeToken = employeeLogin.body.token;
  });

  describe('POST /api/employees', () => {
    it('allows an admin to create an employee', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validEmployeePayload());

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Jane Doe');
      expect(response.body.data.basicSalary).toBe(25000);
    });

    it('links an existing employee account when emails match', async () => {
      const email = 'linked.employee@example.com';
      await User.create({
        name: 'Linked Employee',
        email,
        password: 'EmployeePass123!',
        role: 'employee',
      });

      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validEmployeePayload(), email });

      expect(response.status).toBe(201);
      expect(response.body.accountLinked).toBe(true);
      const account = await User.findOne({ email });
      expect(String(account.employeeId)).toBe(String(response.body.data._id));
    });

    it('rejects a payload missing required fields', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Incomplete Employee' });

      expect(response.status).toBe(400);
    });

    it('blocks an employee role from creating employees', async () => {
      const response = await request(app)
        .post('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(validEmployeePayload());

      expect(response.status).toBe(403);
    });

    it('rejects requests without a token', async () => {
      const response = await request(app)
        .post('/api/employees')
        .send(validEmployeePayload());

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/employees', () => {
    it('returns all employees for an admin', async () => {
      await Employee.create(validEmployeePayload());
      await Employee.create(validEmployeePayload());

      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(2);
    });

    it('blocks an employee role from listing employees', async () => {
      const response = await request(app)
        .get('/api/employees')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/employees/report/pdf', () => {
    it('returns a password-protected PDF report for an admin', async () => {
      await Employee.create(validEmployeePayload());

      const response = await request(app)
        .post('/api/employees/report/pdf')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reportType: 'employee-list', password: 'ReportPass123!' });

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/pdf');
      expect(response.headers['content-disposition']).toContain('employee-list-report.pdf');
      expect(response.body.slice(0, 5).toString()).toBe('%PDF-');
    });

    it('rejects a report password that is too short', async () => {
      const response = await request(app)
        .post('/api/employees/report/pdf')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reportType: 'employee-list', password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 8 characters');
    });
  });

  describe('GET /api/employees/:id', () => {
    it('returns a single employee', async () => {
      const employee = await Employee.create(validEmployeePayload());

      const response = await request(app)
        .get(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data._id).toBe(String(employee._id));
    });

    it('returns 400 for a non-existent employee id', async () => {
      const response = await request(app)
        .get(`/api/employees/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/employees/:id', () => {
    it('updates an employee record', async () => {
      const employee = await Employee.create(validEmployeePayload());

      const response = await request(app)
        .put(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ basicSalary: 30000 });

      expect(response.status).toBe(200);
      expect(response.body.data.basicSalary).toBe(30000);
    });
  });

  describe('DELETE /api/employees/:id', () => {
    it('deletes an employee record', async () => {
      const employee = await Employee.create(validEmployeePayload());

      const response = await request(app)
        .delete(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      const stillExists = await Employee.findById(employee._id);
      expect(stillExists).toBeNull();
    });

    it('blocks an employee role from deleting employees', async () => {
      const employee = await Employee.create(validEmployeePayload());

      const response = await request(app)
        .delete(`/api/employees/${employee._id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      const stillExists = await Employee.findById(employee._id);
      expect(stillExists).not.toBeNull();
    });
  });
});
