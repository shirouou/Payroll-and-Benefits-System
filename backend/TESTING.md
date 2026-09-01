# Testing Guide

## Overview
This project uses **Jest** for unit and integration testing with **Supertest** for API endpoint testing.

## Setup

All test dependencies are already installed:
- `jest` - JavaScript testing framework
- `supertest` - HTTP assertion library for testing APIs

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (re-run on file changes)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

## Test Structure

Tests are located in the `__tests__` directory:
- `__tests__/auth.test.js` - Authentication endpoints (login, register, refresh-token, etc.)
- `__tests__/validators.test.js` - Input validation functions
- `__tests__/setup.js` - Test environment configuration

## Writing Tests

### Basic Test Structure
```javascript
describe('Feature Name', () => {
  beforeEach(async () => {
    // Setup before each test
  });

  afterEach(async () => {
    // Cleanup after each test
  });

  it('should do something', async () => {
    // Test code here
    expect(result).toBe(expected);
  });
});
```

### Testing API Endpoints
```javascript
const request = require('supertest');
const app = require('../server');

describe('API Endpoint', () => {
  it('should return data', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
  });
});
```

## Test Database

Tests automatically use a test MongoDB database (`payroll-benefits-test`) configured in `__tests__/setup.js`.

**Important**: Make sure MongoDB is running before executing tests.

## Coverage

The project has a coverage threshold configured in `jest.config.js`:
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

Run `npm run test:coverage` to see detailed coverage report.

## Environment for Tests

Test environment variables are configured in `__tests__/setup.js`:
- `NODE_ENV=test`
- `JWT_SECRET` - Test JWT secret
- `MONGODB_URI` - Test database URL
- All other required environment variables

## Continuous Integration

To add these tests to CI/CD pipeline (GitHub Actions), add the following to your workflow:

```yaml
- name: Run Tests
  run: npm test
```

## Common Issues

### Tests timeout
- Increase timeout in test file: `jest.setTimeout(20000);`
- Ensure MongoDB is running

### Database connection errors
- Check `MONGODB_URI` in `__tests__/setup.js`
- Ensure MongoDB daemon is running
- Try: `mongod` or `brew services start mongodb-community`

### Tests not found
- Ensure test files end with `.test.js` or `.spec.js`
- Files must be in `__tests__` directory or match `**/*.test.js` pattern

## Next Steps

Add more tests for:
- Employee routes (`__tests__/employees.test.js`)
- Payroll routes (`__tests__/payroll.test.js`)
- HMO routes (`__tests__/hmo.test.js`)
- Claims routes (`__tests__/claims.test.js`)
- Bonus routes (`__tests__/bonuses.test.js`)
- Error handling middleware
- Authentication middleware
- Rate limiting middleware
