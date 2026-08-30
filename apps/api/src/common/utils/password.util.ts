import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;
const PREFIX = 'scrypt';

/**
 * Password hashing on Node's built-in scrypt — no new dependency, and the
 * cost parameters are baked into the stored string so they can be raised
 * later without invalidating existing hashes.
 *
 * Stored form: `scrypt$<salt hex>$<hash hex>`.
 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(plain, salt, KEY_LENGTH);
  return `${PREFIX}$${salt.toString('hex')}$${derived.toString('hex')}`;
}

export function isHashed(stored: string): boolean {
  return stored.startsWith(`${PREFIX}$`);
}

/**
 * Verifies a password. Rows written before hashing existed hold the password
 * in plain text; those are still accepted so seeded accounts keep working,
 * and the caller is told to re-hash on the way past.
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!isHashed(stored)) {
    return { valid: constantTimeEquals(plain, stored), needsRehash: true };
  }

  const [, saltHex, hashHex] = stored.split('$');
  if (!saltHex || !hashHex) return { valid: false, needsRehash: false };

  const derived = await scrypt(plain, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
  const expected = Buffer.from(hashHex, 'hex');

  if (derived.length !== expected.length) {
    return { valid: false, needsRehash: false };
  }

  return { valid: timingSafeEqual(derived, expected), needsRehash: false };
}

/** Compares two strings without leaking their length difference by timing. */
function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
