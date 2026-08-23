const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
require('express-async-errors');

// Load environment variables
dotenv.config();

// Import database connection
const connectDB = require('./config/database');

// Import middleware
const { errorHandler } = require('./middleware/errorHandler');

// Import routes
const employeesRouter = require('./routes/employees');
const payrollRouter = require('./routes/payroll');
const hmoRouter = require('./routes/hmo');
const claimsRouter = require('./routes/claims');
const bonusesRouter = require('./routes/bonuses');
const authRouter = require('./routes/auth');
const { protect } = require('./middleware/auth');

// Initialize Express app
const app = express();

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173').split(',').map(origin => origin.trim());
app.use(cors({
  origin: (origin, callback) => {
    const isLocalDevelopmentOrigin = process.env.NODE_ENV !== 'production'
      && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
    if (!origin || origin === 'null' || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const path = require('path');
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  // SPA fallback: redirect non-API routes to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/employees', protect, employeesRouter);
app.use('/api/payroll', protect, payrollRouter);
app.use('/api/hmo', protect, hmoRouter);
app.use('/api/claims', protect, claimsRouter);
app.use('/api/bonuses', protect, bonusesRouter);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Payroll & Benefits System Backend`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
