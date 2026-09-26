const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const swaggerUi = require('swagger-ui-express');
require('express-async-errors');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

// Import Swagger spec
const swaggerSpec = require('./config/swagger');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');
const securityHeaders = require('./middleware/securityHeaders');
const sanitizeInput = require('./middleware/sanitization');
const { generalLimiter } = require('./middleware/rateLimiting');
const { copilotLimiter } = require('./middleware/rateLimiting');

// Import routes
const employeesRouter = require('./routes/employees');
const payrollRouter = require('./routes/payroll');
const hmoRouter = require('./routes/hmo');
const claimsRouter = require('./routes/claims');
const bonusesRouter = require('./routes/bonuses');
const auditRouter = require('./routes/audit');
const copilotRouter = require('./routes/copilot');
const authRouter = require('./routes/auth');
const { protect, authorize } = require('./middleware/auth');

// Initialize Express app
const app = express();

// Security: Middleware order is important
// 1. Security headers (Helmet)
app.use(securityHeaders);

// 2. Trust proxy in production for accurate IP addresses
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 3. CORS
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(',').map(origin => origin.trim());
app.use(cors({
  origin: (origin, callback) => {
    const isLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production'
      && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    if (!origin || origin === 'null' || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
}));

// 4. Body parsing with size limits
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// 5. Input sanitization
app.use(sanitizeInput);

// 6. Rate limiting
app.use(generalLimiter);

// Health check must run before the production SPA fallback.
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  const frontendDist = path.join(__dirname, 'public');
  app.use(express.static(frontendDist));
  // Serve the SPA only when this deployment includes its built assets.
  const fs = require('fs');
  const frontendIndex = path.join(frontendDist, 'index.html');
  if (fs.existsSync(frontendIndex)) {
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(frontendIndex);
    });
  }
}

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  swaggerOptions: {
    url: '/api-docs.json',
  },
  customCss: '.swagger-ui .topbar { display: none }',
}));

// Swagger JSON endpoint
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/employees', protect, authorize('admin', 'hr'), employeesRouter);
app.use('/api/payroll', protect, authorize('admin', 'hr', 'payroll', 'employee'), payrollRouter);
app.use('/api/hmo', protect, authorize('admin', 'hr'), hmoRouter);
app.use('/api/claims', protect, authorize('admin', 'hr', 'payroll', 'employee'), claimsRouter);
app.use('/api/bonuses', protect, authorize('admin', 'hr'), bonusesRouter);
app.use('/api/audit', protect, authorize('admin'), auditRouter);
app.use('/api/copilot', copilotLimiter, protect, authorize('admin', 'hr', 'payroll', 'employee'), copilotRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandler);

// Start the network listener only when launched directly. Tests import the app.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Payroll & Benefits System Backend`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  process.on('unhandledRejection', (err) => {
    console.log(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

module.exports = app;
