import { describe, expect, test } from 'vitest';

import { generateAccountSecret, generateShortCode, hashSecret } from './secret.js';

describe('generateAccountSecret', () => {
  test('produces a high-entropy, URL-safe string', () => {
    const secret = generateAccountSecret();
    expect(secret.length).toBeGreaterThan(32);
    expect(secret).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  test('never produces the same value twice', () => {
    const a = generateAccountSecret();
    const b = generateAccountSecret();
    expect(a).not.toBe(b);
  });
});

describe('hashSecret', () => {
  test('is deterministic for the same input', () => {
    expect(hashSecret('same-secret')).toBe(hashSecret('same-secret'));
  });

  test('differs for different inputs', () => {
    expect(hashSecret('secret-a')).not.toBe(hashSecret('secret-b'));
  });

  test('never returns the plaintext input', () => {
    expect(hashSecret('my-secret')).not.toBe('my-secret');
  });
});

describe('generateShortCode', () => {
  test('defaults to 8 characters', () => {
    expect(generateShortCode()).toHaveLength(8);
  });

  test('respects a custom length', () => {
    expect(generateShortCode(4)).toHaveLength(4);
  });

  test('never includes visually ambiguous characters (0/O/1/I)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateShortCode(16);
      expect(code).not.toMatch(/[01OI]/);
    }
  });
});
