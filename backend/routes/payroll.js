const express = require('express');
const router = express.Router();
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const { AppError } = require('../middleware/errorHandler');
const {
  calculateWithholdingTax,
  calculateSSSContribution,
  calculatePhilHealthContribution,
  calculatePagIbigContribution,
  calculateNetPay,
} = require('../utils/helpers');

// GET all payroll records
router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'employee' && !req.user.employeeId) {
      throw new AppError('Employee account is not linked to an employee record', 403);
    }
    const filter = req.user.role === 'employee' ? { employeeId: req.user.employeeId } : {};
    const payroll = await Payroll.find(filter)
      .populate('employeeId')
      .sort({ dateProcessed: -1 });
    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

// GET payroll by period
router.get('/period/:period', async (req, res) => {
  try {
    if (req.user.role === 'employee' && !req.user.employeeId) {
      throw new AppError('Employee account is not linked to an employee record', 403);
    }
    const filter = { paymentPeriod: req.params.period };
    if (req.user.role === 'employee') filter.employeeId = req.user.employeeId;
    const payroll = await Payroll.find(filter)
      .populate('employeeId');
    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    throw new AppError(error.message, 500);
  }
});

// GET single payroll record
router.get('/:id', async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate('employeeId');
    if (!payroll) {
      throw new AppError('Payroll record not found', 404);
    }
    if (req.user.role === 'employee' && String(payroll.employeeId?._id || payroll.employeeId) !== String(req.user.employeeId)) {
      throw new AppError('You do not have permission to view this payslip', 403);
    }
    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// CREATE payroll record
router.post('/', async (req, res) => {
  try {
    if (req.user.role === 'employee') throw new AppError('Employees cannot create payroll records', 403);
    const { employeeId, paymentPeriod, basicSalary, workingDays = 22, daysWorked = 22, daysOff = 0, paidLeave = 0, unpaidLeave = 0, holidayDays = 0, overtimeHours = 0, overtimeRate = 0, overtime, allowance, bonusAmount, deductions } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      throw new AppError('Employee not found', 404);
    }

    if (daysWorked < 0 || daysWorked > workingDays) {
      throw new AppError('Days worked must be between 0 and working days', 400);
    }

    const proratedBasicSalary = basicSalary * (daysWorked / workingDays);
    const overtimePay = overtimeHours > 0 ? overtimeHours * overtimeRate : (overtime || 0);
    const grossSalary = proratedBasicSalary + (allowance || 0) + overtimePay + (bonusAmount || 0);

    const sssContribution = calculateSSSContribution(proratedBasicSalary);
    const philhealthContribution = calculatePhilHealthContribution(proratedBasicSalary);
    const pagibigContribution = calculatePagIbigContribution(proratedBasicSalary);
    const taxableIncome = Math.max(grossSalary - sssContribution - philhealthContribution - pagibigContribution, 0);
    const withholdingTax = calculateWithholdingTax(taxableIncome);

    const allDeductions = [
      { name: 'SSS', amount: sssContribution },
      { name: 'PhilHealth', amount: philhealthContribution },
      { name: 'Pag-IBIG', amount: pagibigContribution },
      { name: 'Withholding Tax', amount: withholdingTax },
      ...(deductions || []),
    ];

    const netPay = calculateNetPay(grossSalary, allDeductions);

    const payroll = await Payroll.create({
      employeeId,
      paymentPeriod,
      basicSalary,
      workingDays,
      daysWorked,
      daysOff,
      paidLeave,
      unpaidLeave,
      holidayDays,
      overtimeHours,
      overtimeRate,
      overtime: overtimePay,
      overtimePay,
      proratedBasicSalary,
      allowance,
      overtime,
      bonusAmount,
      grossSalary,
      deductions: allDeductions,
      sssContribution,
      philhealthContribution,
      pagibigContribution,
      withholdingTax,
      netPay,
    });

    res.status(201).json({
      success: true,
      data: payroll,
      message: 'Payroll created successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// UPDATE payroll record
router.put('/:id', async (req, res) => {
  try {
    if (req.user.role === 'employee') throw new AppError('Employees cannot update payroll records', 403);
    const payroll = await Payroll.findById(req.params.id);
    if (!payroll) {
      throw new AppError('Payroll record not found', 404);
    }

    // Recalculate if amounts changed
    if (req.body.basicSalary || req.body.allowance || req.body.overtime || req.body.bonusAmount) {
      const basicSalary = req.body.basicSalary || payroll.basicSalary;
      const allowance = req.body.allowance || payroll.allowance;
      const overtime = req.body.overtime || payroll.overtime;
      const bonusAmount = req.body.bonusAmount || payroll.bonusAmount;

      const grossSalary = basicSalary + allowance + overtime + bonusAmount;
      const deductions = req.body.deductions || payroll.deductions;
      const netPay = calculateNetPay(grossSalary, deductions);

      Object.assign(payroll, req.body, {
        grossSalary,
        netPay,
      });
    } else {
      Object.assign(payroll, req.body);
    }

    await payroll.save();

    res.json({
      success: true,
      data: payroll,
      message: 'Payroll updated successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// DELETE payroll record
router.delete('/:id', async (req, res) => {
  try {
    if (req.user.role === 'employee') throw new AppError('Employees cannot delete payroll records', 403);
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) {
      throw new AppError('Payroll record not found', 404);
    }
    res.json({
      success: true,
      data: {},
      message: 'Payroll deleted successfully',
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

// Run payroll for all active employees
router.post('/run/batch', async (req, res) => {
  try {
    if (req.user.role === 'employee') throw new AppError('Employees cannot run payroll', 403);
    const { paymentPeriod } = req.body;
    const employees = await Employee.find({ status: 'Active' });

    const payrollRecords = [];
    for (const employee of employees) {
      const grossSalary = employee.basicSalary + (employee.allowance || 0);
      const sssContribution = calculateSSSContribution(employee.basicSalary);
      const philhealthContribution = calculatePhilHealthContribution(employee.basicSalary);
      const pagibigContribution = calculatePagIbigContribution(employee.basicSalary);
      const taxableIncome = Math.max(grossSalary - sssContribution - philhealthContribution - pagibigContribution, 0);
      const withholdingTax = calculateWithholdingTax(taxableIncome);

      const allDeductions = [
        { name: 'SSS', amount: sssContribution },
        { name: 'PhilHealth', amount: philhealthContribution },
        { name: 'Pag-IBIG', amount: pagibigContribution },
        { name: 'Withholding Tax', amount: withholdingTax },
      ];

      const netPay = calculateNetPay(grossSalary, allDeductions);

      const payroll = await Payroll.create({
        employeeId: employee._id,
        paymentPeriod,
        basicSalary: employee.basicSalary,
        allowance: employee.allowance || 0,
        grossSalary,
        deductions: allDeductions,
        sssContribution,
        philhealthContribution,
        pagibigContribution,
        withholdingTax,
        netPay,
        status: 'Approved',
      });

      payrollRecords.push(payroll);
    }

    res.status(201).json({
      success: true,
      data: payrollRecords,
      message: `Payroll run for ${paymentPeriod} completed`,
    });
  } catch (error) {
    throw new AppError(error.message, 400);
  }
});

module.exports = router;
