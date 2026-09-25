/**
 * Validators Tests
 * Tests for input validation utilities
 */

const { validatePasswordStrength } = require('../utils/validators');

describe('Input Validators', () => {
  describe('Password Validation', () => {
    it('should validate strong password', () => {
      const result = validatePasswordStrength('StrongPass123!');
      expect(result.valid).toBe(true);
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('strongpass123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('uppercase');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('STRONGPASS123!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('lowercase');
    });

    it('should reject password without numbers', () => {
      const result = validatePasswordStrength('StrongPass!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('numbers');
    });

    it('should reject password without special characters', () => {
      const result = validatePasswordStrength('StrongPass123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('special');
    });

    it('should reject password shorter than 8 characters', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('8 characters');
    });
  });
});
