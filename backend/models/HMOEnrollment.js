const mongoose = require('mongoose');

const hmoEnrollmentSchema = new mongoose.Schema(
  {
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HMOPlan',
      required: true,
    },
    dependents: {
      type: Number,
      default: 0,
      min: 0,
    },
    dateEnrolled: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HMOEnrollment', hmoEnrollmentSchema);
