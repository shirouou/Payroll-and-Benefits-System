const express = require('express');
const router = express.Router();
const HMOPlan = require('../models/HMOPlan');
const HMOEnrollment = require('../models/HMOEnrollment');
const { AppError } = require('../middleware/errorHandler');

// ============ HMO PLANS ============

// GET all HMO plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await HMOPlan.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

// CREATE HMO plan
router.post('/plans', async (req, res) => {
  try {
    const plan = await HMOPlan.create(req.body);
    res.status(201).json({
      success: true,
      data: plan,
      message: 'HMO plan created successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// UPDATE HMO plan
router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await HMOPlan.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!plan) {
      throw new AppError('HMO plan not found', 404);
    }
    res.json({
      success: true,
      data: plan,
      message: 'HMO plan updated successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// DELETE HMO plan
router.delete('/plans/:id', async (req, res) => {
  try {
    const plan = await HMOPlan.findByIdAndDelete(req.params.id);
    if (!plan) {
      throw new AppError('HMO plan not found', 404);
    }
    res.json({
      success: true,
      data: {},
      message: 'HMO plan deleted successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// ============ HMO ENROLLMENTS ============

// GET all enrollments
router.get('/enrollments', async (req, res) => {
  try {
    const enrollments = await HMOEnrollment.find()
      .populate('employeeId')
      .populate('planId')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

// GET employee enrollments
router.get('/enrollments/employee/:employeeId', async (req, res) => {
  try {
    const enrollments = await HMOEnrollment.find({ employeeId: req.params.employeeId })
      .populate('planId');
    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

// CREATE enrollment
router.post('/enrollments', async (req, res) => {
  try {
    const enrollment = await HMOEnrollment.create(req.body);
    await enrollment.populate(['employeeId', 'planId']);
    res.status(201).json({
      success: true,
      data: enrollment,
      message: 'Employee enrolled in HMO plan successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// UPDATE enrollment
router.put('/enrollments/:id', async (req, res) => {
  try {
    const enrollment = await HMOEnrollment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(['employeeId', 'planId']);

    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }
    res.json({
      success: true,
      data: enrollment,
      message: 'Enrollment updated successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// DELETE enrollment
router.delete('/enrollments/:id', async (req, res) => {
  try {
    const enrollment = await HMOEnrollment.findByIdAndDelete(req.params.id);
    if (!enrollment) {
      throw new AppError('Enrollment not found', 404);
    }
    res.json({
      success: true,
      data: {},
      message: 'Enrollment deleted successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

module.exports = router;
