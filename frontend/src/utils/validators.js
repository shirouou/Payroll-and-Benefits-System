/**
 * Form Validation Utilities
 * Provides validation functions for common form fields
 */

export const validators = {
  /**
   * Validate email format
   */
  email: (value) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Invalid email format';
    return null;
  },

  /**
   * Validate password strength
   * Must contain: uppercase, lowercase, numbers, special chars, min 8 chars
   */
  password: (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letters';
    if (!/[a-z]/.test(value)) return 'Password must contain lowercase letters';
    if (!/[0-9]/.test(value)) return 'Password must contain numbers';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return 'Password must contain special characters';
    return null;
  },

  /**
   * Validate required field
   */
  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required`;
    }
    return null;
  },

  /**
   * Validate minimum length
   */
  minLength: (value, min, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length < min) {
      return `${fieldName} must be at least ${min} characters`;
    }
    return null;
  },

  /**
   * Validate maximum length
   */
  maxLength: (value, max, fieldName = 'This field') => {
    if (!value) return null;
    if (value.length > max) {
      return `${fieldName} must not exceed ${max} characters`;
    }
    return null;
  },

  /**
   * Validate number
   */
  number: (value, fieldName = 'This field') => {
    if (!value) return null;
    if (isNaN(value)) return `${fieldName} must be a number`;
    return null;
  },

  /**
   * Validate positive number
   */
  positiveNumber: (value, fieldName = 'This field') => {
    if (!value) return null;
    if (isNaN(value) || Number(value) <= 0) {
      return `${fieldName} must be a positive number`;
    }
    return null;
  },

  /**
   * Validate phone number (basic)
   */
  phone: (value, fieldName = 'Phone number') => {
    if (!value) return null;
    const phoneRegex = /^[\d\s\-\+\(\)]{7,}$/;
    if (!phoneRegex.test(value)) return `${fieldName} is invalid`;
    return null;
  },

  /**
   * Validate URL
   */
  url: (value, fieldName = 'URL') => {
    if (!value) return null;
    try {
      new URL(value);
      return null;
    } catch {
      return `${fieldName} is invalid`;
    }
  },

  /**
   * Validate name (letters, spaces, hyphens, apostrophes)
   */
  name: (value, fieldName = 'Name') => {
    if (!value) return `${fieldName} is required`;
    const nameRegex = /^[a-zA-Z\s\-']+$/;
    if (!nameRegex.test(value)) {
      return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    }
    return null;
  },

  /**
   * Validate date
   */
  date: (value, fieldName = 'Date') => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return `${fieldName} is invalid`;
    return null;
  },

  /**
   * Validate date is in the past
   */
  pastDate: (value, fieldName = 'Date') => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return `${fieldName} is invalid`;
    if (date > new Date()) return `${fieldName} must be in the past`;
    return null;
  },

  /**
   * Validate date is in the future
   */
  futureDate: (value, fieldName = 'Date') => {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return `${fieldName} is invalid`;
    if (date < new Date()) return `${fieldName} must be in the future`;
    return null;
  },

  /**
   * Validate two fields match
   */
  match: (value1, value2, fieldName = 'These fields') => {
    if (value1 !== value2) return `${fieldName} must match`;
    return null;
  },

  /**
   * Validate employee ID format
   */
  employeeId: (value) => {
    if (!value) return 'Employee ID is required';
    const idRegex = /^[A-Z0-9\-]{3,}$/;
    if (!idRegex.test(value)) {
      return 'Employee ID must contain letters, numbers, and hyphens only';
    }
    return null;
  },

  /**
   * Validate SSN format (XXX-XX-XXXX)
   */
  ssn: (value) => {
    if (!value) return null;
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    if (!ssnRegex.test(value)) return 'SSN must be in XXX-XX-XXXX format';
    return null;
  },
};

/**
 * Validate a form object against rules
 * @param {Object} formData - Form data to validate
 * @param {Object} rules - Validation rules for each field
 * @returns {Object} Errors object with field names as keys
 */
export const validateForm = (formData, rules) => {
  const errors = {};

  Object.keys(rules).forEach(fieldName => {
    const fieldRules = rules[fieldName];
    const value = formData[fieldName];

    // Handle string rule (single validator)
    if (typeof fieldRules === 'string') {
      const error = validators[fieldRules]?.(value, fieldName);
      if (error) errors[fieldName] = error;
      return;
    }

    // Handle array of rules
    if (Array.isArray(fieldRules)) {
      for (let rule of fieldRules) {
        let error = null;

        if (typeof rule === 'string') {
          error = validators[rule]?.(value, fieldName);
        } else if (typeof rule === 'function') {
          error = rule(value, fieldName);
        } else if (rule.validator) {
          error = rule.validator(value, rule.arg, fieldName);
        }

        if (error) {
          errors[fieldName] = error;
          break; // Stop at first error for this field
        }
      }
    }
  });

  return errors;
};

/**
 * Validate a single field
 * @param {string} fieldName - Field to validate
 * @param {any} value - Value to validate
 * @param {string|Function|Array} rule - Validation rule(s)
 * @returns {string|null} Error message or null
 */
export const validateField = (fieldName, value, rule) => {
  if (typeof rule === 'string') {
    return validators[rule]?.(value, fieldName) || null;
  }

  if (typeof rule === 'function') {
    return rule(value, fieldName) || null;
  }

  if (Array.isArray(rule)) {
    for (let r of rule) {
      let error = null;

      if (typeof r === 'string') {
        error = validators[r]?.(value, fieldName);
      } else if (typeof r === 'function') {
        error = r(value, fieldName);
      }

      if (error) return error;
    }
  }

  return null;
};
