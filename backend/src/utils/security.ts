/**
 * NEX PLAY - Cryptographic Security Utilities
 * Pure Node.js built-in crypto implementations for password hashing & session tokens.
 * Zero external dependencies, safe on all environments.
 */

import crypto from 'crypto';

/**
 * Hashes a plaintext password using scrypt with a unique random salt.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against a stored salt:hash string using constant-time comparison.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Generates an opaque, cryptographically random session token.
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
