const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('./errorHandler');
const { logAuthAttempt, logSuspiciousActivity } = require('../utils/logger');

const getToken = (req) => {
  const authorization = req.headers.authorization;
  if (!authorization || !authorization.startsWith('Bearer ')) return null;
  return authorization.slice(7);
};

const protect = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return next(new AppError('Authentication required', 401));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('employeeId');
    if (!user || !user.active) {
      logSuspiciousActivity(decoded.id, 'Attempted access with inactive user', req.ip);
      return next(new AppError('User is not active', 401));
    }

    // Check if user account is locked
    if (user.isLocked()) {
      logSuspiciousActivity(user._id, 'Attempted access with locked account', req.ip);
      return next(new AppError('Account is locked. Please try again later.', 401));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token has expired', 401));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    logSuspiciousActivity(req.user?._id, `Unauthorized access attempt to ${roles.join(',')}`, req.ip);
    return next(new AppError('You do not have permission to perform this action', 403));
  }
  next();
};

/**
 * Optional authentication - doesn't require token but validates it if present
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = getToken(req);
    if (!token) return next();

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && user.active) {
      req.user = user;
    }
  } catch (error) {
    // Silently fail optional auth
  }
  next();
};

module.exports = { protect, authorize, optionalAuth, getToken };
