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

// Calculate withholding tax (BIR simplified)
const calculateWithholdingTax = (grossIncome) => {
  // Simplified BIR tax calculation
  if (grossIncome <= 13333) return 0;
  if (grossIncome <= 41666) return (grossIncome - 13333) * 0.05;
  if (grossIncome <= 83333) return 1416.50 + (grossIncome - 41666) * 0.10;
  if (grossIncome <= 250000) return 5616.70 + (grossIncome - 83333) * 0.15;
  return 30566.70 + (grossIncome - 250000) * 0.20;
};

// Calculate SSS contribution
const calculateSSSContribution = (basicSalary) => {
  // Employee SSS rate (current as of 2024)
  const rate = 0.045; // 4.5%
  return basicSalary * rate;
};

// Calculate PhilHealth contribution
const calculatePhilHealthContribution = (basicSalary) => {
  // Employee PhilHealth rate
  const rate = 0.025; // 2.5%
  return basicSalary * rate;
};

// Calculate Pag-IBIG contribution
const calculatePagIbigContribution = (basicSalary) => {
  // Employee Pag-IBIG rate
  const rate = 0.02; // 2%
  const maxContribution = 100;
  const contribution = basicSalary * rate;
  return Math.min(contribution, maxContribution);
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
