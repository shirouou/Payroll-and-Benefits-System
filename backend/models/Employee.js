const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide employee name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    position: {
      type: String,
      required: [true, 'Please provide position'],
    },
    department: {
      type: String,
      required: [true, 'Please provide department'],
    },
    basicSalary: {
      type: Number,
      required: [true, 'Please provide basic salary'],
      min: 0,
    },
    allowance: {
      type: Number,
      default: 0,
      min: 0,
    },
    dateHired: {
      type: Date,
      required: [true, 'Please provide hire date'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'On Leave', 'Suspended'],
      default: 'Active',
    },
    bankAccount: {
      type: String,
      trim: true,
    },
    bankName: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    sssNumber: String,
    philhealthNumber: String,
    pagibigNumber: String,
    tin: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);
