import { createHash, randomBytes } from 'node:crypto';

/**
 * A high-entropy random secret, returned to the client exactly once at
 * account creation and never stored server-side — only its hash is kept.
 * A fast hash (not a slow KDF like bcrypt/scrypt) is appropriate here since
 * this is high-entropy random data, not a low-entropy user-chosen password.
 */
export function generateAccountSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}

// Excludes visually ambiguous characters (0/O, 1/I) since these codes are
// meant to be read off one device and typed into another.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateShortCode(length = 8): string {
  const bytes = randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i++) {
    code += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length];
  }
  return code;
}
