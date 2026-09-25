/**
 * Helper functions for payroll calculations and utilities
 */

// Generate unique ID
const generateId = () => {
  return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// Format currency to PHP
const formatPeso = (amount) => {
  return '₱' + parseFloat(amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Calculate 13th month pay
const calculate13thMonth = (basicSalary, monthsWorked) => {
  return (basicSalary / 12) * monthsWorked;
};

// Calculate withholding tax using the current Philippine monthly progressive bracket.
// This is a simplified but realistic placeholder aligned to the current BIR table for employees.
const calculateWithholdingTax = (grossIncome) => {
  if (grossIncome <= 25000) return 0;
  if (grossIncome <= 83333) return (grossIncome - 25000) * 0.15;
  if (grossIncome <= 166667) return 8750 + (grossIncome - 83333) * 0.20;
  if (grossIncome <= 333333) return 29167 + (grossIncome - 166667) * 0.25;
  if (grossIncome <= 666667) return 72917 + (grossIncome - 333333) * 0.30;
  if (grossIncome <= 1666667) return 167917 + (grossIncome - 666667) * 0.35;
  return 500000 + (grossIncome - 1666667) * 0.40;
};

// Calculate employee SSS contribution based on the current monthly contribution table.
// The employee share is typically 4.5% capped at a current maximum monthly contribution.
const calculateSSSContribution = (basicSalary) => {
  const rate = 0.045;
  const maxContribution = 1350;
  return Math.min(basicSalary * rate, maxContribution);
};

// Calculate employee PhilHealth contribution using the current 5% rate with a capped contribution.
const calculatePhilHealthContribution = (basicSalary) => {
  const rate = 0.05;
  const maxContribution = 2500;
  return Math.min(basicSalary * rate, maxContribution);
};

// Calculate employee Pag-IBIG contribution using the current 2% rate with a capped contribution.
const calculatePagIbigContribution = (basicSalary) => {
  const rate = 0.02;
  const maxContribution = 200;
  return Math.min(basicSalary * rate, maxContribution);
};

// Calculate net pay
const calculateNetPay = (grossSalary, deductions = []) => {
  const totalDeductions = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);
  return grossSalary - totalDeductions;
};

// Validate email
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Parse date to YYYY-MM-DD format
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

module.exports = {
  generateId,
  formatPeso,
  calculate13thMonth,
  calculateWithholdingTax,
  calculateSSSContribution,
  calculatePhilHealthContribution,
  calculatePagIbigContribution,
  calculateNetPay,
  validateEmail,
  formatDate,
};
