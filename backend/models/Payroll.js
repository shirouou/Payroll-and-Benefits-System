const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    paymentPeriod: {
      type: String,
      required: true, // e.g., "2024-01"
    },
    basicSalary: {
      type: Number,
      required: true,
    },
    workingDays: {
      type: Number,
      default: 22,
      min: 1,
    },
    daysWorked: {
      type: Number,
      default: 22,
      min: 0,
    },
    daysOff: {
      type: Number,
      default: 0,
      min: 0,
    },
    paidLeave: {
      type: Number,
      default: 0,
      min: 0,
    },
    unpaidLeave: {
      type: Number,
      default: 0,
      min: 0,
    },
    holidayDays: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimeRate: {
      type: Number,
      default: 0,
      min: 0,
    },
    overtimePay: {
      type: Number,
      default: 0,
      min: 0,
    },
    proratedBasicSalary: {
      type: Number,
    },
    allowance: {
      type: Number,
      default: 0,
    },
    overtime: {
      type: Number,
      default: 0,
    },
    bonusAmount: {
      type: Number,
      default: 0,
    },
    grossSalary: {
      type: Number,
      required: true,
    },
    deductions: [
      {
        name: String,
        amount: Number,
      },
    ],
    sssContribution: Number,
    philhealthContribution: Number,
    pagibigContribution: Number,
    withholdingTax: Number,
    netPay: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Draft', 'Approved', 'Paid', 'Voided'],
      default: 'Draft',
    },
    dateProcessed: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payroll', payrollSchema);
