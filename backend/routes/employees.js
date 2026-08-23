const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const { AppError } = require('../middleware/errorHandler');

// GET all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

// Get employees by status
router.get('/status/:status', async (req, res) => {
  try {
    const employees = await Employee.find({ status: req.params.status });
    res.json({
      success: true,
      data: employees,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

// GET single employee
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }
    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// CREATE employee
router.post('/', async (req, res) => {
  try {
    const employee = await Employee.create(req.body);
    res.status(201).json({
      success: true,
      data: employee,
      message: 'Employee created successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// UPDATE employee
router.put('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }
    res.json({
      success: true,
      data: employee,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }
    res.json({
      success: true,
      data: {},
      message: 'Employee deleted successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

module.exports = router;
