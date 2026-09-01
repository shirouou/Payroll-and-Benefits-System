/**
 * Setup file for tests
 * Runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only-min-32-chars';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-for-testing-purposes-only-min-32-chars';
process.env.ENCRYPTION_KEY = 'test-encryption-key-for-testing-purposes-only-min-32-chars-long';
process.env.MONGODB_URI = 'mongodb://localhost:27017/payroll-benefits-test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:5173';
process.env.PORT = 5000;
process.env.LOG_LEVEL = 'error'; // Suppress logs during tests

// Suppress console output during tests
global.console.log = jest.fn();
global.console.info = jest.fn();
global.console.warn = jest.fn();

// Set default timeout
jest.setTimeout(10000);
