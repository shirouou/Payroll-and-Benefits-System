const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { protect, getToken } = require('../middleware/auth');
const { validateLogin, validateRegister, handleValidationErrors } = require('../utils/validators');
const { logAuthAttempt, logDataAccess } = require('../utils/logger');
const { loginLimiter, registerLimiter, resetLimiter } = require('../middleware/rateLimiting');
const emailService = require('../utils/emailService');
const crypto = require('crypto');

const router = express.Router();

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE || '7d' }
);

const generateRefreshToken = (user) => jwt.sign(
  { id: user._id, type: 'refresh' },
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Register a new user
 *     description: Create a new user account with name, email, and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Must contain uppercase, lowercase, numbers, and special characters. Minimum 8 characters.
 *                 example: SecurePass123!
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token for getting new access tokens
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Login user
 *     description: Authenticate with email and password. Returns JWT tokens for authenticated session.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   description: JWT access token (expires in 7 days)
 *                 refreshToken:
 *                   type: string
 *                   description: JWT refresh token (expires in 30 days)
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *                 requiresTwoFactor:
 *                   type: boolean
 *                   description: True if user has 2FA enabled
 *       401:
 *         description: Invalid credentials or account locked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Refresh access token
 *     description: Get a new access token using a valid refresh token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Get current user profile
 *     description: Retrieve the logged-in user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Request password reset
 *     description: Send a password reset link to the user's email address
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent (if account exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/reset-password/{token}:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Reset password with token
 *     description: Set a new password using the reset token sent via email
 *     parameters:
 *       - name: token
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePass123!
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *                 example: NewSecurePass123!
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * @swagger
 * /api/auth/2fa/setup:
 *   post:
 *     tags:
 *       - Two-Factor Authentication
 *     summary: Setup two-factor authentication
 *     description: Generate QR code and backup codes for 2FA setup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 2FA setup initiated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 qrCode:
 *                   type: string
 *                   description: Base64 encoded QR code image
 *                 secret:
 *                   type: string
 *                 backupCodes:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

/**
 * LOGIN
 */
router.post('/login', loginLimiter, validateLogin, handleValidationErrors, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      logAuthAttempt(email, false, req.ip, req.headers['user-agent']);
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is locked
    if (user.isLocked()) {
      logAuthAttempt(email, false, req.ip, req.headers['user-agent']);
      throw new AppError('Account is locked. Please try again after 2 hours.', 401);
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      await user.incLoginAttempts();
      logAuthAttempt(email, false, req.ip, req.headers['user-agent']);
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.active) {
      logAuthAttempt(email, false, req.ip, req.headers['user-agent']);
      throw new AppError('User account is inactive', 401);
    }

    // Reset login attempts on successful login
    if (user.loginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    await user.updateLastLogin();

    // If 2FA is enabled, return flag and require 2FA verification
    if (user.twoFactorEnabled) {
      logAuthAttempt(email, true, req.ip, req.headers['user-agent']);
      return res.json({
        success: true,
        requiresTwoFactor: true,
        tempToken: jwt.sign(
          { id: user._id, type: 'temp', twoFactorRequired: true },
          process.env.JWT_SECRET,
          { expiresIn: '5m' }
        ),
      });
    }

    logAuthAttempt(email, true, req.ip, req.headers['user-agent']);
    logDataAccess(user._id, 'login', 'auth', req.ip);

    res.json({
      success: true,
      token: signToken(user),
      refreshToken: generateRefreshToken(user),
      data: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * REGISTER
 */
router.post('/register', registerLimiter, validateRegister, handleValidationErrors, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'viewer',
    });

    logAuthAttempt(email, true, req.ip, req.headers['user-agent']);
    logDataAccess(user._id, 'register', 'auth', req.ip);

    res.status(201).json({
      success: true,
      token: signToken(user),
      refreshToken: generateRefreshToken(user),
      data: user.toSafeObject(),
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return next(new AppError(`${field} already exists`, 400));
    }
    next(error);
  }
});

/**
 * GET CURRENT USER
 */
router.get('/me', protect, (req, res) => {
  logDataAccess(req.user._id, 'view_profile', 'auth', req.ip);
  res.json({ success: true, data: req.user.toSafeObject() });
});

/**
 * REFRESH TOKEN
 */
router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    if (decoded.type !== 'refresh') {
      throw new AppError('Invalid token type', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.active) {
      throw new AppError('User not found or inactive', 401);
    }

    logDataAccess(user._id, 'refresh_token', 'auth', req.ip);

    res.json({
      success: true,
      token: signToken(user),
      refreshToken: generateRefreshToken(user),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * SETUP TWO-FACTOR AUTHENTICATION
 */
router.post('/2fa/setup', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    // Generate 2FA secret
    const { secret, qrCode, backupCodes } = user.generateTwoFactorSecret();
    await user.save();

    logDataAccess(user._id, 'setup_2fa', '2fa', req.ip);

    res.json({
      success: true,
      message: 'Scan this QR code with your authenticator app',
      qrCode,
      secret,
      backupCodes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * VERIFY AND ENABLE TWO-FACTOR AUTHENTICATION
 */
router.post('/2fa/verify', protect, async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      throw new AppError('2FA token is required', 400);
    }

    const user = await User.findById(req.user._id);

    // Verify token
    const isValid = user.verifyTwoFactorToken(token);
    if (!isValid) {
      throw new AppError('Invalid 2FA token', 401);
    }

    user.twoFactorEnabled = true;
    await user.save();

    logDataAccess(user._id, 'enable_2fa', '2fa', req.ip);

    res.json({
      success: true,
      message: '2FA has been enabled successfully',
      backupCodes: user.twoFactorBackupCodes,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * VERIFY 2FA TOKEN AFTER LOGIN
 */
router.post('/2fa/verify-login', async (req, res, next) => {
  try {
    const { tempToken, token } = req.body;
    if (!tempToken || !token) {
      throw new AppError('Temporary token and 2FA token are required', 400);
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (error) {
      throw new AppError('Invalid or expired temporary token', 401);
    }

    if (!decoded.twoFactorRequired) {
      throw new AppError('Invalid token', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.active) {
      throw new AppError('User not found or inactive', 401);
    }

    // Try regular token first
    let isValid = user.verifyTwoFactorToken(token);

    // If not valid, try backup codes
    if (!isValid) {
      isValid = user.useTwoFactorBackupCode(token);
    }

    if (!isValid) {
      logAuthAttempt(user.email, false, req.ip, req.headers['user-agent']);
      throw new AppError('Invalid 2FA token or backup code', 401);
    }

    // Save if backup code was used
    if (!user.verifyTwoFactorToken(token)) {
      await user.save();
    }

    logAuthAttempt(user.email, true, req.ip, req.headers['user-agent']);
    logDataAccess(user._id, 'login_2fa', 'auth', req.ip);

    res.json({
      success: true,
      token: signToken(user),
      refreshToken: generateRefreshToken(user),
      data: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * DISABLE TWO-FACTOR AUTHENTICATION
 */
router.post('/2fa/disable', protect, async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password) {
      throw new AppError('Password is required to disable 2FA', 400);
    }

    const user = await User.findById(req.user._id).select('+password');
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid password', 401);
    }

    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    user.twoFactorBackupCodes = [];
    await user.save();

    logDataAccess(user._id, 'disable_2fa', '2fa', req.ip);

    res.json({ success: true, message: '2FA has been disabled' });
  } catch (error) {
    next(error);
  }
});

/**
 * REQUEST PASSWORD RESET
 */
router.post('/forgot-password', resetLimiter, async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists
      return res.json({
        success: true,
        message: 'If an account exists, you will receive a password reset email',
      });
    }

    // Generate password reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    } catch (emailError) {
      // Log error but still respond successfully to not reveal if email exists
      console.error('Failed to send password reset email:', emailError.message);
    }

    logDataAccess(user._id, 'request_password_reset', 'auth', req.ip);

    res.json({
      success: true,
      message: 'If an account exists, you will receive a password reset email',
    });
  } catch (error) {
    next(error);
  }
});

/**
 * RESET PASSWORD WITH TOKEN
 */
router.post('/reset-password/:token', async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;

    if (!password || !confirmPassword) {
      throw new AppError('Password and confirmation are required', 400);
    }

    if (password !== confirmPassword) {
      throw new AppError('Passwords do not match', 400);
    }

    if (password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    // Hash the token to compare with database
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    logDataAccess(user._id, 'reset_password', 'auth', req.ip);

    res.json({
      success: true,
      message: 'Password has been reset successfully',
      token: signToken(user),
      refreshToken: generateRefreshToken(user),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * CHANGE PASSWORD
 */
router.post('/change-password', protect, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      throw new AppError('All password fields are required', 400);
    }

    if (newPassword !== confirmPassword) {
      throw new AppError('New passwords do not match', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('New password must be at least 8 characters', 400);
    }

    const user = await User.findById(req.user._id).select('+password');
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Check if new password is different from current
    const isSamePassword = await user.comparePassword(newPassword);
    if (isSamePassword) {
      throw new AppError('New password must be different from current password', 400);
    }

    user.password = newPassword;
    await user.save();

    logDataAccess(user._id, 'change_password', 'auth', req.ip);

    res.json({
      success: true,
      message: 'Password has been changed successfully',
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
