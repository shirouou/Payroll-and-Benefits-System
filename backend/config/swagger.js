const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Payroll & Benefits System API',
      version: '1.0.0',
      description: 'Complete API documentation for Oxford Suites Makati Payroll & Benefits System',
      contact: {
        name: 'API Support',
        email: 'support@payrollsystem.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
      {
        url: 'https://api.payrollsystem.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token for API authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', format: 'email', example: 'john@example.com' },
            role: { 
              type: 'string', 
              enum: ['admin', 'hr', 'payroll', 'employee'],
              example: 'employee'
            },
            active: { type: 'boolean', example: true },
            twoFactorEnabled: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Employee: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string', example: 'John' },
            lastName: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email' },
            employeeId: { type: 'string', example: 'EMP001' },
            position: { type: 'string', example: 'Software Engineer' },
            department: { type: 'string', example: 'IT' },
            salary: { type: 'number', format: 'double', example: 50000 },
            status: { 
              type: 'string',
              enum: ['active', 'inactive', 'resigned'],
              example: 'active'
            },
            dateOfJoining: { type: 'string', format: 'date' },
          },
        },
        Payroll: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            employeeId: { type: 'string' },
            month: { type: 'number', example: 1 },
            year: { type: 'number', example: 2024 },
            baseSalary: { type: 'number', format: 'double' },
            deductions: { type: 'array', items: { type: 'object' } },
            bonuses: { type: 'array', items: { type: 'object' } },
            netSalary: { type: 'number', format: 'double' },
            status: { 
              type: 'string',
              enum: ['draft', 'approved', 'processed'],
              example: 'draft'
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            statusCode: { type: 'number', example: 400 },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './routes/auth.js',
    './routes/employees.js',
    './routes/payroll.js',
    './routes/hmo.js',
    './routes/claims.js',
    './routes/bonuses.js',
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
