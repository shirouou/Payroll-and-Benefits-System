/**
 * Security headers middleware
 * Uses Helmet.js to set various HTTP headers for security
 */

const helmet = require('helmet');

// Configure Helmet to set security headers
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      fontSrc: ["'self'", 'fonts.gstatic.com'],
      connectSrc: ["'self'", process.env.API_URL || 'localhost:3001'],
    },
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },
});

module.exports = securityHeaders;
