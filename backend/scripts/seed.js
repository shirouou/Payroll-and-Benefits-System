require('dotenv').config();

const mongoose = require('mongoose');
const Employee = require('../models/Employee');
const HMOPlan = require('../models/HMOPlan');
const HMOEnrollment = require('../models/HMOEnrollment');
const BonusPlan = require('../models/BonusPlan');
const Claim = require('../models/Claim');
const Payroll = require('../models/Payroll');
const User = require('../models/User');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll-benefits';

async function connectToDatabase() {
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(`Connected to MongoDB: ${mongoUri}`);
}

async function seedDatabase() {
  await User.deleteMany({});
  await Employee.deleteMany({});
  await HMOPlan.deleteMany({});
  await HMOEnrollment.deleteMany({});
  await BonusPlan.deleteMany({});
  await Claim.deleteMany({});
  await Payroll.deleteMany({});

  const employees = await Employee.insertMany([
    {
      name: 'Maria Santos',
      email: 'maria.santos@casamarbella.com',
      position: 'HR Manager',
      department: 'Human Resources',
      basicSalary: 45000,
      allowance: 5000,
      dateHired: new Date('2021-02-15'),
      status: 'Active',
      bankAccount: '0012345678',
      bankName: 'BDO',
      phone: '+63 917 111 2233',
      address: 'Makati City',
      sssNumber: '01-2345678-9',
      philhealthNumber: 'PH-123456789',
      pagibigNumber: '1234-5678-9012',
      tin: '123-456-789',
    },
    {
      name: 'John Dela Cruz',
      email: 'john.delacruz@casamarbella.com',
      position: 'Senior Accountant',
      department: 'Finance',
      basicSalary: 42000,
      allowance: 3500,
      dateHired: new Date('2020-07-10'),
      status: 'Active',
      bankAccount: '0098765432',
      bankName: 'Metrobank',
      phone: '+63 920 990 1122',
      address: 'Pasig City',
      sssNumber: '01-3456789-0',
      philhealthNumber: 'PH-987654321',
      pagibigNumber: '5678-9012-3456',
      tin: '987-654-321',
    },
    {
      name: 'Anna Reyes',
      email: 'anna.reyes@casamarbella.com',
      position: 'Operations Supervisor',
      department: 'Operations',
      basicSalary: 38000,
      allowance: 3000,
      dateHired: new Date('2022-01-09'),
      status: 'Active',
      bankAccount: '0045678912',
      bankName: 'BPI',
      phone: '+63 912 345 6789',
      address: 'Quezon City',
      sssNumber: '01-4567890-1',
      philhealthNumber: 'PH-456789012',
      pagibigNumber: '2345-6789-0123',
      tin: '456-789-012',
    },
  ]);

  const plans = await HMOPlan.insertMany([
    {
      name: 'Classic Care',
      description: 'Basic HMO coverage for employees and one dependent.',
      coverage: 250000,
      premium: 3500,
      status: 'Active',
    },
    {
      name: 'Executive Plus',
      description: 'Premium HMO plan with wider hospital coverage and add-ons.',
      coverage: 500000,
      premium: 7500,
      status: 'Active',
    },
  ]);

  const enrollments = await HMOEnrollment.insertMany([
    {
      employeeId: employees[0]._id,
      planId: plans[0]._id,
      dependents: 2,
      dateEnrolled: new Date('2024-01-05'),
      status: 'Active',
    },
    {
      employeeId: employees[1]._id,
      planId: plans[1]._id,
      dependents: 1,
      dateEnrolled: new Date('2024-02-08'),
      status: 'Active',
    },
  ]);

  await BonusPlan.insertMany([
    {
      name: '13th Month Bonus',
      description: 'Annual year-end bonus for active employees.',
      bonusType: 'Fixed Amount',
      amount: 20000,
      applicableTo: ['All'],
      bonusMonth: 12,
      status: 'Active',
    },
    {
      name: 'Performance Incentive',
      description: 'Quarterly incentive for top-performing employees.',
      bonusType: 'Percentage',
      amount: 10,
      applicableTo: ['Finance', 'Operations'],
      bonusMonth: 3,
      status: 'Active',
    },
  ]);

  await Payroll.insertMany([
    {
      employeeId: employees[0]._id,
      paymentPeriod: '2026-08',
      basicSalary: 45000,
      allowance: 5000,
      overtime: 1500,
      bonusAmount: 2000,
      grossSalary: 52000,
      deductions: [
        { name: 'SSS', amount: 2025 },
        { name: 'PhilHealth', amount: 1125 },
        { name: 'Pag-IBIG', amount: 900 },
      ],
      sssContribution: 2025,
      philhealthContribution: 1125,
      pagibigContribution: 900,
      withholdingTax: 3500,
      netPay: 43000,
      status: 'Approved',
      dateProcessed: new Date('2026-08-02'),
      notes: 'August payroll for HR department.',
    },
    {
      employeeId: employees[1]._id,
      paymentPeriod: '2026-08',
      basicSalary: 42000,
      allowance: 3500,
      overtime: 0,
      bonusAmount: 1500,
      grossSalary: 43500,
      deductions: [
        { name: 'SSS', amount: 1890 },
        { name: 'PhilHealth', amount: 1050 },
        { name: 'Pag-IBIG', amount: 840 },
      ],
      sssContribution: 1890,
      philhealthContribution: 1050,
      pagibigContribution: 840,
      withholdingTax: 3200,
      netPay: 38520,
      status: 'Draft',
      dateProcessed: new Date('2026-08-02'),
      notes: 'Finance payroll review pending approval.',
    },
  ]);

  await Claim.insertMany([
    {
      enrollmentId: enrollments[0]._id,
      employeeId: employees[0]._id,
      claimDate: new Date('2026-08-01'),
      serviceDate: new Date('2026-07-25'),
      provider: 'Casa Marbella Medical Center',
      description: 'Consultation and diagnostic services',
      claimAmount: 8500,
      approvedAmount: 7200,
      status: 'Approved',
      notes: 'Approved by HMO administrator',
    },
    {
      enrollmentId: enrollments[1]._id,
      employeeId: employees[1]._id,
      claimDate: new Date('2026-08-02'),
      serviceDate: new Date('2026-07-30'),
      provider: 'St. Luke Clinic',
      description: 'Follow-up checkup and medication',
      claimAmount: 4300,
      approvedAmount: 0,
      status: 'Pending',
      notes: 'Awaiting medical review',
    },
  ]);

  await User.create({
    name: 'System Administrator',
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
    role: 'admin',
  });

  await User.create({
    name: 'Payroll Manager',
    email: process.env.PAYROLL_EMAIL || 'payroll@example.com',
    password: process.env.PAYROLL_PASSWORD || 'ChangeMe123!',
    role: 'payroll',
  });

  await User.create({
    name: 'Human Resources Manager',
    email: process.env.HR_EMAIL || 'hr@example.com',
    password: process.env.HR_PASSWORD || 'ChangeMe123!',
    role: 'hr',
  });

  console.log('Database seeded successfully');
  console.log(`Created ${employees.length} employees, ${plans.length} HMO plans, ${enrollments.length} enrollments, and sample payroll/claims.`);
}

async function main() {
  try {
    await connectToDatabase();
    await seedDatabase();
  } catch (error) {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

main();
