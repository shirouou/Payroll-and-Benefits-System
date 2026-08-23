const express = require('express');
const router = express.Router();
const BonusPlan = require('../models/BonusPlan');
const { AppError } = require('../middleware/errorHandler');

// GET all bonus plans
router.get('/', async (req, res) => {
  try {
    const bonuses = await BonusPlan.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: bonuses,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

// GET single bonus plan
router.get('/:id', async (req, res) => {
  try {
    const bonus = await BonusPlan.findById(req.params.id);
    if (!bonus) {
      throw new AppError('Bonus plan not found', 404);
    }
    res.json({
      success: true,
      data: bonus,
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// CREATE bonus plan
router.post('/', async (req, res) => {
  try {
    const bonus = await BonusPlan.create(req.body);
    res.status(201).json({
      success: true,
      data: bonus,
      message: 'Bonus plan created successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// UPDATE bonus plan
router.put('/:id', async (req, res) => {
  try {
    const bonus = await BonusPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!bonus) {
      throw new AppError('Bonus plan not found', 404);
    }
    res.json({
      success: true,
      data: bonus,
      message: 'Bonus plan updated successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// DELETE bonus plan
router.delete('/:id', async (req, res) => {
  try {
    const bonus = await BonusPlan.findByIdAndDelete(req.params.id);
    if (!bonus) {
      throw new AppError('Bonus plan not found', 404);
    }
    res.json({
      success: true,
      data: {},
      message: 'Bonus plan deleted successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

module.exports = router;
