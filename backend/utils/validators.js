/**
 * Input validation rules using express-validator
 * Prevents SQL injection, XSS, and other input-based attacks
 */

const { body, param, validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

/**
 * Validation middleware handler
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => `${err.path || err.param}: ${err.msg}`);
    return next(new AppError(messages.join(', '), 400));
  }
  next();
};

/**
 * Email validation
 */
const validateEmail = body('email')
  .trim()
  .isEmail()
  .withMessage('Invalid email format')
  .normalizeEmail()
  .toLowerCase();

/**
 * Password validation
 */
const validatePassword = body('password')
  .trim()
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number')
  .matches(/[!@#$%^&*]/)
  .withMessage('Password must contain at least one special character (!@#$%^&*)');

const validatePasswordStrength = password => {
  const errors = [];
  if (typeof password !== 'string' || password.length < 8) errors.push('8 characters');
  if (!/[A-Z]/.test(password)) errors.push('uppercase');
  if (!/[a-z]/.test(password)) errors.push('lowercase');
  if (!/[0-9]/.test(password)) errors.push('numbers');
  if (!/[!@#$%^&*]/.test(password)) errors.push('special');
  return { valid: errors.length === 0, errors };
};

/**
 * Name validation
 */
const validateName = body('name')
  .trim()
  .isLength({ min: 2 })
  .withMessage('Name must be at least 2 characters')
  .matches(/^[a-zA-Z\s'-]+$/)
  .withMessage('Name can only contain letters, spaces, hyphens, and apostrophes');

/**
 * Login validation
 */
const validateLogin = [
  validateEmail,
  body('password').trim().notEmpty().withMessage('Password is required'),
];

/**
 * Register validation
 */
const validateRegister = [
  validateName,
  validateEmail,
  validatePassword,
];

/**
 * ID validation (MongoDB ObjectId)
 */
const validateId = param('id')
  .isMongoId()
  .withMessage('Invalid ID format');

/**
 * String field validation (prevents XSS)
 */
const validateString = (fieldName) =>
  body(fieldName)
    .trim()
    .isLength({ min: 1 })
    .withMessage(`${fieldName} is required`)
    .escape() // Escape HTML characters
    .withMessage(`${fieldName} contains invalid characters`);

/**
 * Employee data validation
 */
const validateEmployeeData = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('department').trim().notEmpty().withMessage('Department is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('ssn').optional().trim().matches(/^\d{9}$/).withMessage('Invalid SSN format'),
];

/**
 * Payroll data validation
 */
const validatePayrollData = [
  body('employeeId').isMongoId().withMessage('Invalid employee ID'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Invalid month'),
  body('year').isInt({ min: 2000, max: 2100 }).withMessage('Invalid year'),
  body('baseSalary').isFloat({ min: 0 }).withMessage('Base salary must be positive'),
  body('deductions').optional().isArray().withMessage('Deductions must be an array'),
  body('bonuses').optional().isArray().withMessage('Bonuses must be an array'),
];

module.exports = {
  handleValidationErrors,
  validateLogin,
  validateRegister,
  validateEmail,
  validatePassword,
  validatePasswordStrength,
  validateName,
  validateId,
  validateString,
  validateEmployeeData,
  validatePayrollData,
};
