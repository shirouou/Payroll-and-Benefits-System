const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const Payroll = require('../models/Payroll');
const HMOEnrollment = require('../models/HMOEnrollment');
const User = require('../models/User');
const PDFDocument = require('pdfkit');
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

// EXPORT employee report as a password-protected PDF
router.post('/report/pdf', async (req, res) => {
  try {
    const password = String(req.body.password || '');
    if (password.length < 8) {
      throw new AppError('PDF password must be at least 8 characters', 400);
    }

    const filter = {};
    if (req.body.status && req.body.status !== 'All') filter.status = req.body.status;
    if (req.body.department) filter.department = req.body.department;

    const employees = await Employee.find(filter).sort({ department: 1, name: 1 });
    const reportType = req.body.reportType || 'employee-list';
    const reportTitle = reportType === 'salary'
      ? 'Employee Salary Report'
      : reportType === 'department-summary'
        ? 'Department Summary Report'
        : reportType === 'status-summary'
          ? 'Employee Status Summary Report'
          : 'Employee Directory Report';

    const document = new PDFDocument({
      size: 'A4',
      margin: 42,
      userPassword: password,
      ownerPassword: `${password}-owner`,
      permissions: { printing: 'highResolution', copying: false, modifying: false },
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-report.pdf"`);
    document.pipe(res);
    document.fontSize(18).text(reportTitle, { align: 'center' });
    document.moveDown(0.5);
    document.fontSize(9).fillColor('#666666').text(`Generated ${new Date().toLocaleString()} | Records: ${employees.length}`, { align: 'center' });
    document.moveDown(1.2).fillColor('#222222');

    const drawTable = (headers, rows, widths) => {
      const startX = 42;
      const tableWidth = widths.reduce((total, width) => total + width, 0);
      const rowHeight = 25;
      let y = document.y;
      const drawHeader = () => {
        if (y + rowHeight > 780) {
          document.addPage();
          y = 42;
        }
        document.rect(startX, y, tableWidth, rowHeight).fill('#a61e22');
        let x = startX;
        headers.forEach((header, index) => {
          document.fillColor('#ffffff').fontSize(8).text(header, x + 6, y + 8, {
            width: widths[index] - 12,
            lineBreak: false,
            ellipsis: true,
          });
          x += widths[index];
        });
        y += rowHeight;
      };

      drawHeader();
      rows.forEach((row, rowIndex) => {
        if (y + rowHeight > 780) {
          document.addPage();
          y = 42;
          drawHeader();
        }
        if (rowIndex % 2 === 0) document.rect(startX, y, tableWidth, rowHeight).fill('#fff5f5');
        document.rect(startX, y, tableWidth, rowHeight).stroke('#eadfe1');
        let x = startX;
        row.forEach((value, index) => {
          document.fillColor('#222222').fontSize(8).text(String(value), x + 6, y + 8, {
            width: widths[index] - 12,
            lineBreak: false,
            ellipsis: true,
          });
          x += widths[index];
        });
        y += rowHeight;
      });
      document.y = y;
    };

    if (reportType === 'department-summary' || reportType === 'status-summary') {
      const key = reportType === 'department-summary' ? 'department' : 'status';
      const groups = employees.reduce((result, employee) => {
        const group = employee[key] || 'Unassigned';
        if (!result[group]) result[group] = { count: 0, salary: 0 };
        result[group].count += 1;
        result[group].salary += Number(employee.basicSalary || 0);
        return result;
      }, {});
      drawTable(
        [reportType === 'department-summary' ? 'Department' : 'Status', 'Employees', 'Basic salary total'],
        Object.entries(groups).map(([group, summary]) => [group, summary.count, `PHP ${summary.salary.toLocaleString()}`]),
        [260, 90, 160]
      );
    } else {
      if (reportType === 'salary') {
        drawTable(
          ['Employee', 'Department', 'Status', 'Basic salary', 'Allowance'],
          employees.map(employee => [
            employee.name,
            employee.department,
            employee.status,
            `PHP ${Number(employee.basicSalary || 0).toLocaleString()}`,
            `PHP ${Number(employee.allowance || 0).toLocaleString()}`,
          ]),
          [150, 110, 80, 90, 80]
        );
      } else {
        drawTable(
          ['Employee', 'Email', 'Position', 'Department', 'Status'],
          employees.map(employee => [employee.name, employee.email, employee.position, employee.department, employee.status]),
          [100, 150, 95, 95, 70]
        );
      }
    }

    document.end();
  } catch (error) {
    throw new AppError(error.message, error.statusCode || 400);
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
    const payload = {
      ...req.body,
      email: String(req.body.email || '').trim().toLowerCase(),
    };
    const employee = await Employee.create(payload);
    const user = await User.findOne({ email: employee.email });
    if (user && !['admin', 'hr', 'payroll'].includes(user.role)) {
      user.employeeId = employee._id;
      user.role = 'employee';
      await user.save();
    }

    res.status(201).json({
      success: true,
      data: employee,
      accountLinked: Boolean(user && !['admin', 'hr', 'payroll'].includes(user.role)),
      message: user && !['admin', 'hr', 'payroll'].includes(user.role)
        ? 'Employee created and account linked successfully'
        : 'Employee created successfully',
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
    const [payrollCount, enrollmentCount, userCount] = await Promise.all([
      Payroll.countDocuments({ employeeId: req.params.id }),
      HMOEnrollment.countDocuments({ employeeId: req.params.id }),
      User.countDocuments({ employeeId: req.params.id }),
    ]);
    if (payrollCount || enrollmentCount || userCount) {
      throw new AppError('Employee cannot be deleted because payroll, benefits, or user records are linked to this employee. Mark the employee Inactive instead.', 409);
    }

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
    if (error instanceof AppError) throw error;
    throw new AppError(error.message, 400);
  }
});

module.exports = router;
