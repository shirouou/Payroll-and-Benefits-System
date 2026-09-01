const nodemailer = require('nodemailer');
const { logger } = require('./logger');

/**
 * Email Service for sending emails
 * Supports password reset, notifications, and other transactional emails
 */

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  /**
   * Initialize email transporter
   */
  initTransporter() {
    try {
      // Check if email is configured
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
        logger.warn('Email service not configured. Emails will be logged to console only.');
        this.enabled = false;
        return;
      }

      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production',
        },
      });

      this.enabled = true;
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email service', error);
      this.enabled = false;
    }
  }

  /**
   * Send email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @param {string} options.text - Email text content (fallback)
   * @returns {Promise<Object>} Email result
   */
  async send(options) {
    try {
      const { to, subject, html, text } = options;

      if (!to) {
        throw new Error('Recipient email is required');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        html: html || text,
        text: text || html,
      };

      // Log email if not enabled (development/test)
      if (!this.enabled) {
        logger.info(`[EMAIL] To: ${to}, Subject: ${subject}`);
        return { success: true, messageId: 'dev-mode' };
      }

      // Send email
      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${to}`, { messageId: result.messageId });
      return result;
    } catch (error) {
      logger.error('Failed to send email', error);
      throw error;
    }
  }

  /**
   * Send password reset email
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} resetToken - Password reset token
   * @returns {Promise<Object>} Email result
   */
  async sendPasswordResetEmail(email, name, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const expiresIn = '1 hour'; // Should match backend token expiry

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { color: #333; margin-bottom: 20px; }
            .button { 
              display: inline-block;
              padding: 12px 24px;
              background-color: #4CAF50;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer { 
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
            .warning { color: #d32f2f; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="header">Password Reset Request</h2>
            
            <p>Hi ${name},</p>
            
            <p>We received a request to reset your password. Click the button below to proceed:</p>
            
            <center>
              <a href="${resetUrl}" class="button">Reset Password</a>
            </center>
            
            <p>Or copy this link into your browser:</p>
            <p style="word-break: break-all;">${resetUrl}</p>
            
            <p class="warning">⚠️ This link will expire in ${expiresIn}</p>
            
            <p>If you did not request a password reset, please ignore this email. Your account remains secure.</p>
            
            <div class="footer">
              <p>Oxford Suites Makati - Payroll & Benefits System</p>
              <p>© ${new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Password Reset Request

Hi ${name},

We received a request to reset your password. Click the link below to proceed:
${resetUrl}

This link will expire in ${expiresIn}.

If you did not request a password reset, please ignore this email. Your account remains secure.

---
Oxford Suites Makati - Payroll & Benefits System
© ${new Date().getFullYear()} All rights reserved.
    `.trim();

    return this.send({
      to: email,
      subject: 'Password Reset Request - Payroll & Benefits System',
      html: htmlContent,
      text: textContent,
    });
  }

  /**
   * Send welcome email
   * @param {string} email - User email
   * @param {string} name - User name
   * @returns {Promise<Object>} Email result
   */
  async sendWelcomeEmail(email, name) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { color: #333; margin-bottom: 20px; }
            .footer { 
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="header">Welcome to Payroll & Benefits System</h2>
            
            <p>Hi ${name},</p>
            
            <p>Welcome to the Oxford Suites Makati Payroll & Benefits System!</p>
            
            <p>Your account has been successfully created. You can now log in with your email and password.</p>
            
            <p>If you have any questions or need assistance, please contact your HR department.</p>
            
            <div class="footer">
              <p>Oxford Suites Makati - Payroll & Benefits System</p>
              <p>© ${new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Welcome to Payroll & Benefits System

Hi ${name},

Welcome to the Oxford Suites Makati Payroll & Benefits System!

Your account has been successfully created. You can now log in with your email and password.

If you have any questions or need assistance, please contact your HR department.

---
Oxford Suites Makati - Payroll & Benefits System
© ${new Date().getFullYear()} All rights reserved.
    `.trim();

    return this.send({
      to: email,
      subject: 'Welcome to Payroll & Benefits System',
      html: htmlContent,
      text: textContent,
    });
  }

  /**
   * Send 2FA backup codes email
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {Array<string>} backupCodes - Backup codes
   * @returns {Promise<Object>} Email result
   */
  async sendTwoFactorBackupCodesEmail(email, name, backupCodes) {
    const codesHtml = backupCodes.map((code, index) => 
      `<tr><td style="padding: 8px; text-align: center; font-family: monospace; background-color: #f5f5f5;">${code}</td></tr>`
    ).join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { color: #333; margin-bottom: 20px; }
            .warning { 
              background-color: #fff3cd;
              border: 1px solid #ffc107;
              padding: 12px;
              border-radius: 4px;
              margin: 15px 0;
              color: #856404;
            }
            .footer { 
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="header">Two-Factor Authentication Enabled</h2>
            
            <p>Hi ${name},</p>
            
            <p>Two-Factor Authentication has been successfully enabled on your account.</p>
            
            <p><strong>Keep these backup codes safe.</strong> You can use them to access your account if you lose access to your authenticator app.</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              ${codesHtml}
            </table>
            
            <div class="warning">
              <strong>⚠️ Important:</strong> Store these codes in a safe place. Each code can only be used once. Do not share these codes with anyone.
            </div>
            
            <div class="footer">
              <p>Oxford Suites Makati - Payroll & Benefits System</p>
              <p>© ${new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Two-Factor Authentication Enabled

Hi ${name},

Two-Factor Authentication has been successfully enabled on your account.

Keep these backup codes safe. You can use them to access your account if you lose access to your authenticator app:

${backupCodes.map((code, index) => `${index + 1}. ${code}`).join('\n')}

⚠️ Important: Store these codes in a safe place. Each code can only be used once. Do not share these codes with anyone.

---
Oxford Suites Makati - Payroll & Benefits System
© ${new Date().getFullYear()} All rights reserved.
    `.trim();

    return this.send({
      to: email,
      subject: '2FA Backup Codes - Payroll & Benefits System',
      html: htmlContent,
      text: textContent,
    });
  }

  /**
   * Send account locked notification
   * @param {string} email - User email
   * @param {string} name - User name
   * @returns {Promise<Object>} Email result
   */
  async sendAccountLockedEmail(email, name) {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 8px; }
            .header { color: #d32f2f; margin-bottom: 20px; }
            .warning { 
              background-color: #ffebee;
              border: 1px solid #f44336;
              padding: 12px;
              border-radius: 4px;
              margin: 15px 0;
              color: #c62828;
            }
            .footer { 
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="header">⚠️ Account Security Alert</h2>
            
            <p>Hi ${name},</p>
            
            <div class="warning">
              <strong>Your account has been temporarily locked</strong> due to multiple failed login attempts.
            </div>
            
            <p>Your account will be automatically unlocked after 2 hours.</p>
            
            <p>If this wasn't you, please reset your password immediately:</p>
            
            <p>
              <a href="${process.env.FRONTEND_URL}/forgot-password" style="color: #4CAF50; text-decoration: none;">
                Reset Password
              </a>
            </p>
            
            <div class="footer">
              <p>Oxford Suites Makati - Payroll & Benefits System</p>
              <p>© ${new Date().getFullYear()} All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const textContent = `
Account Security Alert

Hi ${name},

Your account has been temporarily locked due to multiple failed login attempts.

Your account will be automatically unlocked after 2 hours.

If this wasn't you, please reset your password immediately at:
${process.env.FRONTEND_URL}/forgot-password

---
Oxford Suites Makati - Payroll & Benefits System
© ${new Date().getFullYear()} All rights reserved.
    `.trim();

    return this.send({
      to: email,
      subject: 'Account Security Alert - Payroll & Benefits System',
      html: htmlContent,
      text: textContent,
    });
  }
}

// Export singleton instance
module.exports = new EmailService();
