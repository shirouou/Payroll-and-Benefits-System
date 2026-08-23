const mongoose = require('mongoose');

const deductionSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    type: {
      type: String,
      enum: ['SSS', 'PhilHealth', 'Pag-IBIG', 'Withholding Tax', 'Loan', 'Other'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentPeriod: String,
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Deduction', deductionSchema);
