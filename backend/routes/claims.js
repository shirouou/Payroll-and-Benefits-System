const express = require('express');
const router = express.Router();
const Claim = require('../models/Claim');
const { AppError } = require('../middleware/errorHandler');

// GET all claims
router.get('/', async (req, res) => {
  try {
    const claims = await Claim.find()
      .populate('employeeId')
      .populate('enrollmentId')
      .sort({ createdAt: -1 });
    res.json({
      success: true,
      data: claims,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

// GET single claim
router.get('/:id', async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('employeeId')
      .populate('enrollmentId');
    if (!claim) {
      throw new AppError('Claim not found', 404);
    }
    res.json({
      success: true,
      data: claim,
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// CREATE claim
router.post('/', async (req, res) => {
  try {
    const claim = await Claim.create(req.body);
    await claim.populate(['employeeId', 'enrollmentId']);
    res.status(201).json({
      success: true,
      data: claim,
      message: 'Claim created successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// UPDATE claim
router.put('/:id', async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate(['employeeId', 'enrollmentId']);

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }
    res.json({
      success: true,
      data: claim,
      message: 'Claim updated successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// APPROVE claim
router.post('/:id/approve', async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'Approved', approvedAmount: req.body.approvedAmount },
      { new: true, runValidators: true }
    ).populate(['employeeId', 'enrollmentId']);

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }
    res.json({
      success: true,
      data: claim,
      message: 'Claim approved successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// REJECT claim
router.post('/:id/reject', async (req, res) => {
  try {
    const claim = await Claim.findByIdAndUpdate(
      req.params.id,
      { status: 'Rejected', notes: req.body.notes },
      { new: true }
    ).populate(['employeeId', 'enrollmentId']);

    if (!claim) {
      throw new AppError('Claim not found', 404);
    }
    res.json({
      success: true,
      data: claim,
      message: 'Claim rejected successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// GET claims by status
router.get('/status/:status', async (req, res) => {
  try {
    const claims = await Claim.find({ status: req.params.status })
      .populate('employeeId')
      .populate('enrollmentId');
    res.json({
      success: true,
      data: claims,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

module.exports = router;
