/**
 * Utility functions for formatting and calculations
 */

export const formatPeso = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatShortDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-PH');
};

export const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export const calculateMonthsWorked = (dateHired) => {
  const today = new Date();
  const hireDate = new Date(dateHired);
  let months = (today.getFullYear() - hireDate.getFullYear()) * 12;
  months += today.getMonth() - hireDate.getMonth();
  return Math.max(0, months);
};

export const calculate13thMonth = (basicSalary, monthsWorked) => {
  return (basicSalary / 12) * monthsWorked;
};

export const truncateText = (text, length = 50) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

export const getCurrentMonthYear = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${year}-${month}`;
};

export const generatePeriodOptions = (months = 12) => {
  const now = new Date();
  const options = [];
  
  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const value = `${year}-${month}`;
    const label = date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  
  return options;
};
