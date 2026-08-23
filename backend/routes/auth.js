const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AppError } = require('../middleware/errorHandler');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRE || '7d' }
);

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required', 400);

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new AppError('Invalid email or password', 401);
  }
  if (!user.active) throw new AppError('User account is inactive', 401);

  res.json({ success: true, token: signToken(user), data: user.toSafeObject() });
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required', 400);
  }
  if (password.length < 8) {
    throw new AppError('Password must be at least 8 characters', 400);
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    role: 'viewer',
  });

  res.status(201).json({ success: true, token: signToken(user), data: user.toSafeObject() });
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, data: req.user.toSafeObject() });
});

module.exports = router;
