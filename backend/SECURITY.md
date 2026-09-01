# Security Features Implementation Guide

This document outlines all the security features implemented in the Payroll and Benefits System.

## 1. Authentication & Authorization

### JWT (JSON Web Tokens)
- **Implementation**: Token-based authentication using JWT
- **Location**: [routes/auth.js](routes/auth.js), [middleware/auth.js](middleware/auth.js)
- **Features**:
  - Secure token generation with expiration
  - Refresh token mechanism for session continuity
  - Token validation on protected routes

### Role-Based Access Control (RBAC)
- **Roles**: admin, hr, payroll, viewer
- **Authorization Middleware**: `authorize()` function in [middleware/auth.js](middleware/auth.js)
- **Usage**: 
  ```javascript
  app.use('/api/employees', protect, authorize('admin', 'hr'), employeesRouter);
  ```

### Account Lockout
- **Max Login Attempts**: 5 attempts
- **Lockout Duration**: 2 hours
- **Implementation**: [models/User.js](models/User.js) - `isLocked()`, `incLoginAttempts()`, `resetLoginAttempts()`

---

## 2. Password Security

### Password Hashing
- **Algorithm**: bcryptjs with salt rounds of 12
- **Location**: [models/User.js](models/User.js)
- **Features**:
  - One-way encryption using bcrypt
  - Passwords never stored in plain text

### Password Validation
- **Minimum Length**: 8 characters
- **Required Components**:
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*)
- **Location**: [utils/validators.js](utils/validators.js)

### Password Reset
- **Token Expiry**: 1 hour
- **Token Generation**: Cryptographically secure random tokens
- **Flow**: User requests reset → Email sent with link → Token validated → Password changed
- **Location**: [routes/auth.js](routes/auth.js) - `/forgot-password`, `/reset-password/:token`

### Password Change
- **Current Password Verification**: Required before changing
- **New Password Validation**: Must differ from current password
- **Password History**: Previous passwords tracked to prevent reuse
- **Location**: [routes/auth.js](routes/auth.js) - `/change-password`

---

## 3. Two-Factor Authentication (2FA)

### Setup & Enablement
- **Method**: Time-based One-Time Password (TOTP) using Speakeasy
- **QR Code Generation**: For easy setup with authenticator apps
- **Backup Codes**: 10 single-use backup codes generated during setup
- **Location**: [routes/auth.js](routes/auth.js) - `/2fa/setup`, `/2fa/verify`

### 2FA During Login
- **Flow**:
  1. User logs in with email/password
  2. Temporary token issued for 5 minutes
  3. User enters 2FA code from authenticator app or backup code
  4. Full access tokens issued upon verification
- **Location**: [routes/auth.js](routes/auth.js) - `/login`, `/2fa/verify-login`

### Backup Codes
- **Generation**: Cryptographically random hex codes
- **Single Use**: Once used, code is permanently deleted
- **Usage**: If authenticator app is unavailable
- **Storage**: Encrypted at rest in database

---

## 4. Data Encryption

### At Rest Encryption
- **Algorithm**: AES (Advanced Encryption Standard)
- **Library**: CryptoJS
- **Usage**: Encrypt sensitive data like SSN, bank details, health information
- **Location**: [utils/encryption.js](utils/encryption.js)
- **Functions**:
  ```javascript
  const encrypted = encrypt(sensitiveData);
  const decrypted = decrypt(encryptedData);
  ```

### In Transit Encryption
- **HTTPS**: Required in production (enforced via CORS and headers)
- **Secure Headers**: Helmet.js enforces HSTS (HTTP Strict Transport Security)
- **Location**: [middleware/securityHeaders.js](middleware/securityHeaders.js)

---

## 5. Input Validation & Sanitization

### Input Validation
- **Library**: express-validator
- **Validators**: Email, password, name, ID, custom field validation
- **Location**: [utils/validators.js](utils/validators.js)
- **Features**:
  - Type checking
  - Format validation (email, MongoDB ID)
  - Length constraints
  - Pattern matching (regex)

### Input Sanitization
- **NoSQL Injection Prevention**: express-mongo-sanitize
- **XSS Prevention**: HTML escaping via express-validator
- **Location**: [middleware/sanitization.js](middleware/sanitization.js)
- **Example**:
  ```javascript
  app.use(sanitizeInput); // Removes $ and . from input
  ```

---

## 6. Rate Limiting & Brute Force Protection

### Rate Limiters
- **General Limiter**: 100 requests per 15 minutes per IP
- **Login Limiter**: 5 login attempts per 15 minutes per IP
- **Register Limiter**: 3 registrations per hour per IP
- **Password Reset Limiter**: 3 reset requests per hour per IP
- **Location**: [middleware/rateLimiting.js](middleware/rateLimiting.js)

### Configuration
- **Window**: Time period for counting requests
- **Max**: Maximum requests allowed in window
- **Skip Successful**: Login limiter resets counter on successful login

---

## 7. Security Headers

### Implemented Headers (via Helmet.js)
- **Content-Security-Policy (CSP)**: Prevents inline scripts and unauthorized resource loading
- **X-Frame-Options**: Denies embedding in frames (prevents clickjacking)
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Legacy XSS filter
- **Referrer-Policy**: Controls referrer information
- **HSTS**: Forces HTTPS for 1 year
- **Location**: [middleware/securityHeaders.js](middleware/securityHeaders.js)

---

## 8. Logging & Monitoring

### Log Types
- **Authentication Logs**: Login attempts, registrations, password changes
- **Data Access Logs**: Who accessed what data and when
- **Suspicious Activity Logs**: Failed attempts, unauthorized access
- **Error Logs**: Application errors and exceptions

### Log Management
- **Library**: Winston
- **File Rotation**: 5MB max file size, 10 files per log type
- **Log Location**: `backend/logs/` directory
- **Levels**: error, warn, info, debug
- **Location**: [utils/logger.js](utils/logger.js)

### Log Functions
```javascript
logAuthAttempt(email, success, ip, userAgent);
logDataAccess(userId, action, resource, ip);
logSuspiciousActivity(userId, activity, ip);
logError(error, context);
```

---

## 9. Session Management

### Token-Based Sessions
- **Access Token**: Short-lived (7 days by default)
- **Refresh Token**: Long-lived (30 days by default)
- **Refresh Endpoint**: `/api/auth/refresh-token`

### Session Features
- **Last Login Tracking**: Recorded for audit purposes
- **Session Timeout**: Configurable via environment
- **Token Revocation**: Can implement via token blacklist

### Refresh Token Flow
```
1. User logs in → Receives access token + refresh token
2. Access token expires → Use refresh token to get new access token
3. Refresh token expires → Must log in again
```

---

## 10. CORS (Cross-Origin Resource Sharing)

### Configuration
- **Allowed Origins**: Configurable via `CORS_ORIGIN` env variable
- **Credentials**: Cookies/auth headers supported
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Location**: [server.js](server.js)

### Default Origins
```
Development: localhost:3000, localhost:5173
Production: Set via environment variable
```

---

## 11. Deployment Security

### Environment Variables
- **All sensitive data**: Stored in `.env` (never committed to git)
- **Template**: Use `.env.example` for reference
- **Location**: [.env.example](.env.example)

### Production Checklist
```
☐ Set NODE_ENV=production
☐ Use strong JWT_SECRET (32+ characters)
☐ Use strong ENCRYPTION_KEY (32+ characters)
☐ Set up HTTPS/SSL certificates
☐ Configure database authentication
☐ Set CORS_ORIGIN to specific domain
☐ Set up email service for password resets
☐ Configure proper logging levels
☐ Enable 2FA for admin accounts
☐ Regular security audits
☐ Monitor logs for suspicious activity
☐ Keep dependencies updated
```

### HTTPS Enforcement
- In production, always use HTTPS
- Redirect HTTP to HTTPS
- Configure HSTS headers (1 year validity)
- Use valid SSL certificates

---

## 12. Dependency Security

### Installed Security Packages
```json
{
  "express-validator": "Input validation",
  "express-rate-limit": "Rate limiting",
  "helmet": "Security headers",
  "express-mongo-sanitize": "NoSQL injection prevention",
  "crypto-js": "Data encryption",
  "speakeasy": "2FA/TOTP support",
  "qrcode": "QR code generation",
  "winston": "Logging"
}
```

### Dependency Updates
- Regular updates to patch security vulnerabilities
- Use `npm audit` to check for vulnerabilities
- Use `npm audit fix` to automatically patch

---

## 13. Testing Security

### Manual Testing Checklist
```
☐ Invalid login attempts trigger account lockout
☐ 2FA setup generates QR code and backup codes
☐ 2FA verification blocks login without correct code
☐ Password reset tokens expire after 1 hour
☐ Rate limiting blocks excessive requests
☐ XSS attempts are sanitized
☐ NoSQL injection attempts are blocked
☐ Unauthorized access returns 403 Forbidden
☐ Invalid tokens return 401 Unauthorized
☐ Sensitive data is encrypted in database
```

### Integration Tests
```bash
npm test
```

---

## 14. Incident Response

### Security Incident Steps
1. **Identify**: Monitor logs for suspicious activity
2. **Contain**: Lock affected accounts if necessary
3. **Eradicate**: Remove malicious data/code
4. **Recover**: Restore clean backups
5. **Communicate**: Notify affected users
6. **Review**: Update security measures

### Contacts for Emergencies
- Security Team: [configure]
- Incident Response: [configure]
- Legal/Compliance: [configure]

---

## 15. Compliance & Standards

### Standards Compliance
- **OWASP Top 10**: All major vulnerabilities addressed
- **GDPR**: Personal data protection features
- **HIPAA**: Health information protection (encryption, access logs)
- **PCI DSS**: Payment data security (if applicable)

### Regular Audits
- Monthly security code reviews
- Quarterly penetration testing
- Annual compliance audits
- Immediate response to vulnerability reports

---

## 16. Maintenance & Updates

### Regular Tasks
- **Monthly**: Review and analyze logs
- **Quarterly**: Security code review
- **Bi-annually**: Penetration testing
- **Annually**: Compliance audit

### Reporting
- Generate monthly security reports
- Track and remediate vulnerabilities
- Monitor third-party dependencies
- Update security documentation

---

## Configuration Summary

### Key Environment Variables

| Variable | Purpose | Default | Production |
|----------|---------|---------|-----------|
| JWT_SECRET | Token signing | dev-key | Strong random 32+ chars |
| ENCRYPTION_KEY | Data encryption | dev-key | Strong random 32+ chars |
| NODE_ENV | Environment | development | production |
| CORS_ORIGIN | Allowed origins | localhost | Specific domain |
| LOG_LEVEL | Logging level | info | error/warn |
| EMAIL_HOST | Email service | smtp.gmail.com | Your SMTP server |

---

## Support & Questions

For security-related questions or to report vulnerabilities:
1. Review this documentation
2. Check the code comments
3. Contact the security team
4. **Never** disclose vulnerabilities publicly

---

**Last Updated**: August 2026
**Security Level**: High
**Status**: Production Ready
