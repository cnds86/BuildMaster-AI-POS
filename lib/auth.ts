
import { hash, compare, hashSync, compareSync } from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Asynchronously hashes a password.
 */
export async function hashPassword(plain: string): Promise<string> {
  return await hash(plain, SALT_ROUNDS);
}

/**
 * Asynchronously verifies a password against a hash.
 */
export async function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return await compare(plain, hashed);
}

/**
 * Synchronously hashes a password (useful for client-side stores/seeds).
 */
export function hashPasswordSync(plain: string): string {
  return hashSync(plain, SALT_ROUNDS);
}

/**
 * Synchronously verifies a password (useful for client-side auth).
 */
export function verifyPasswordSync(plain: string, hashed: string): boolean {
  return compareSync(plain, hashed);
}
