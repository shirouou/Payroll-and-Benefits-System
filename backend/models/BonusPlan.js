const mongoose = require('mongoose');

const bonusPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide bonus plan name'],
    },
    description: {
      type: String,
    },
    bonusType: {
      type: String,
      enum: ['Percentage', 'Fixed Amount', 'Performance'],
      default: 'Fixed Amount',
    },
    amount: {
      type: Number,
      required: [true, 'Please provide bonus amount'],
    },
    applicableTo: [
      {
        type: String, // Department or Position
      },
    ],
    bonusMonth: {
      type: Number,
      required: true, // Month when bonus is given (1-12)
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BonusPlan', bonusPlanSchema);
