const mongoose = require('mongoose');

const hmoPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide HMO plan name'],
      unique: true,
    },
    description: {
      type: String,
    },
    coverage: {
      type: Number,
      required: [true, 'Please provide annual coverage amount'],
    },
    premium: {
      type: Number,
      required: [true, 'Please provide monthly premium'],
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HMOPlan', hmoPlanSchema);
