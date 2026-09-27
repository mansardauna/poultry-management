'use strict';
import crypto from 'crypto';

const OWNER_SECRET = process.env.PFMS_OWNER_SECRET || 'pfms-owner-secret-key-2026-production';

/**
 * Creates a signed owner session token valid for 24 hours.
 */
export function createOwnerToken(username: string): string {
  const timestamp = Date.now();
  const payload = `${username}:${timestamp}`;
  const signature = crypto.createHmac('sha256', OWNER_SECRET).update(payload).digest('hex');
  return `${payload}:${signature}`;
}

/**
 * Validates a signed owner session token.
 */
export function isValidOwnerToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split(':');
  if (parts.length !== 3) return false;
  const [username, timestampStr, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;

  // 24 hour session validity
  if (Date.now() - timestamp > 24 * 60 * 60 * 1000) return false;

  const expectedSignature = crypto
    .createHmac('sha256', OWNER_SECRET)
    .update(`${username}:${timestamp}`)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Checks whether an incoming request/cookieStore has a valid owner session.
 */
export async function verifyOwnerSession(cookies: { get: (name: string) => { value: string } | undefined }): Promise<boolean> {
  const token = cookies.get('pfms_setup_auth')?.value;
  return isValidOwnerToken(token);
}
