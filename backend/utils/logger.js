/**
 * Logging utility using Winston
 * Logs authentication attempts, data access, and suspicious activities
 */

const winston = require('winston');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level.toUpperCase()}]: ${info.message}`
  )
);

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    // Combined logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.level}]: ${info.message}`
        )
      ),
    })
  );
}

/**
 * Log authentication attempt
 */
const logAuthAttempt = (email, success, ip, userAgent) => {
  const message = `Auth attempt - Email: ${email}, Success: ${success}, IP: ${ip}, UserAgent: ${userAgent}`;
  if (!success) {
    logger.warn(message);
  } else {
    logger.info(message);
  }
};

/**
 * Log data access
 */
const logDataAccess = (userId, action, resource, ip) => {
  const message = `Data access - UserID: ${userId}, Action: ${action}, Resource: ${resource}, IP: ${ip}`;
  logger.info(message);
};

/**
 * Log suspicious activity
 */
const logSuspiciousActivity = (userId, activity, ip) => {
  const message = `Suspicious activity - UserID: ${userId}, Activity: ${activity}, IP: ${ip}`;
  logger.warn(message);
};

/**
 * Log errors
 */
const logError = (error, context) => {
  const message = `Error in ${context}: ${error.message}`;
  logger.error(message, { stack: error.stack });
};

module.exports = {
  logger,
  logAuthAttempt,
  logDataAccess,
  logSuspiciousActivity,
  logError,
};
