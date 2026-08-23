const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    enrollmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HMOEnrollment',
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: true,
    },
    claimDate: {
      type: Date,
      required: true,
    },
    serviceDate: {
      type: Date,
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    claimAmount: {
      type: Number,
      required: true,
    },
    approvedAmount: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Paid'],
      default: 'Pending',
    },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Claim', claimSchema);
