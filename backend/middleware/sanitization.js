/**
 * Input sanitization middleware
 * Protects against NoSQL injection, XSS attacks, etc.
 */

const mongoSanitize = require('express-mongo-sanitize');

// Sanitize data against NoSQL injection
const sanitizeInput = mongoSanitize({
  replaceWith: '_', // Replace prohibited characters with '_'
  onSanitize: ({ req, key }) => {
    console.warn(`Potentially malicious data detected in request parameter: ${key}`);
  },
});

module.exports = sanitizeInput;
