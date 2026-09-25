const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'hr', 'payroll', 'employee'],
      default: 'employee',
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    active: {
      type: Boolean,
      default: true,
    },
    // Two-Factor Authentication
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorSecret: {
      type: String,
      select: false,
    },
    twoFactorBackupCodes: [{
      type: String,
    }],
    // Password reset
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: Date,
    // Password history (prevent reusing same password)
    passwordHistory: [{
      password: String,
      changedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Copilot conversation history
    copilotHistory: [{
      role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true,
      },
      text: {
        type: String,
        required: true,
      },
      source: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Login tracking
    lastLogin: Date,
    lastPasswordChange: Date,
    passwordChanges: [{
      changedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Account lockout
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: Date,
  },
  { timestamps: true }
);

userSchema.pre('save', async function savePassword(next) {
  if (!this.isModified('password')) return next();
  
  // Store password in history before hashing
  if (this.password) {
    this.passwordHistory.push({
      password: this.password,
      changedAt: new Date(),
    });
    this.lastPasswordChange = new Date();
  }
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    employeeId: this.employeeId,
    twoFactorEnabled: this.twoFactorEnabled,
  };
};

// Two-Factor Authentication methods
userSchema.methods.generateTwoFactorSecret = function generateTwoFactorSecret() {
  const secret = speakeasy.generateSecret({
    name: `Payroll System (${this.email})`,
    issuer: 'Payroll & Benefits',
    length: 32,
  });
  
  this.twoFactorSecret = secret.base32;
  
  // Generate backup codes
  this.twoFactorBackupCodes = [];
  for (let i = 0; i < 10; i++) {
    const backupCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    this.twoFactorBackupCodes.push(backupCode);
  }
  
  return {
    secret: secret.base32,
    qrCode: secret.otpauth_url,
    backupCodes: this.twoFactorBackupCodes,
  };
};

userSchema.methods.verifyTwoFactorToken = function verifyTwoFactorToken(token) {
  const verified = speakeasy.totp.verify({
    secret: this.twoFactorSecret,
    encoding: 'base32',
    token: String(token),
    window: 2,
  });
  
  return verified;
};

userSchema.methods.useTwoFactorBackupCode = function useTwoFactorBackupCode(code) {
  const index = this.twoFactorBackupCodes.indexOf(code.toUpperCase());
  if (index > -1) {
    this.twoFactorBackupCodes.splice(index, 1);
    return true;
  }
  return false;
};

// Password reset token generation
userSchema.methods.generatePasswordResetToken = function generatePasswordResetToken() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return resetToken;
};

// Account lockout methods
userSchema.methods.incLoginAttempts = function incLoginAttempts() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }
  
  // Otherwise we're incrementing
  const updates = { $inc: { loginAttempts: 1 } };

  // Hard lockout after 10 attempts for 2 hours (a CAPTCHA challenge is required starting at 5)
  const maxAttempts = 10;
  const lockTimespan = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + lockTimespan };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function resetLoginAttempts() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

userSchema.methods.isLocked = function isLocked() {
  return this.lockUntil && this.lockUntil > Date.now();
};

userSchema.methods.updateLastLogin = function updateLastLogin() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
