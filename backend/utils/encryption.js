/**
 * Encryption/Decryption utilities for sensitive data at rest
 * Uses AES encryption to protect sensitive information like SSN, bank details, etc.
 */

const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';

/**
 * Encrypt sensitive data
 * @param {string} data - Data to encrypt
 * @returns {string} - Encrypted data
 */
const encrypt = (data) => {
  if (!data) return null;
  return CryptoJS.AES.encrypt(String(data), ENCRYPTION_KEY).toString();
};

/**
 * Decrypt sensitive data
 * @param {string} encryptedData - Encrypted data
 * @returns {string} - Decrypted data
 */
const decrypt = (encryptedData) => {
  if (!encryptedData) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (err) {
    console.error('Decryption error:', err.message);
    return null;
  }
};

/**
 * Hash sensitive data (one-way)
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data
 */
const hashData = (data) => {
  if (!data) return null;
  return CryptoJS.SHA256(String(data)).toString();
};

module.exports = { encrypt, decrypt, hashData };
