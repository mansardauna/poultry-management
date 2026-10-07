'use strict';

import { SignJWT, jwtVerify } from 'jose';

export const SESSION_COOKIE_NAME = 'pfms_session';

/**
 * Resolve the HMAC signing secret.
 * Priority: SESSION_SECRET env -> persisted random secret in data/.session-secret (generated once).
 * There is intentionally NO hardcoded fallback secret.
 */
let cachedKey: Uint8Array | null = null;

function resolveSecret(): Uint8Array {
  if (cachedKey) return cachedKey;

  const envSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET;
  if (envSecret && envSecret.trim().length > 0) {
    if (envSecret.length >= 32) {
      cachedKey = new TextEncoder().encode(envSecret);
      return cachedKey;
    }
    // Expand shorter secret via SHA-256 to ensure standard 32-byte (256-bit) HMAC key
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto') as typeof import('crypto');
    const hash = crypto.createHash('sha256').update(envSecret).digest();
    cachedKey = new Uint8Array(hash);
    return cachedKey;
  }

  // Persisted secret in data/.session-secret (works across reboots when filesystem is writable)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const crypto = require('crypto') as typeof import('crypto');

    const dir = path.join(process.cwd(), 'data');
    const file = path.join(dir, '.session-secret');
    let secret = '';
    if (fs.existsSync(file)) {
      secret = fs.readFileSync(file, 'utf8').trim();
    }
    if (!secret || secret.length < 32) {
      secret = crypto.randomBytes(48).toString('base64url');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, secret, { encoding: 'utf8', mode: 0o600 });
    }
    cachedKey = new TextEncoder().encode(secret);
    return cachedKey;
  } catch {
    // Filesystem may be read-only in serverless/containerized deployments
  }

  // Fallback: Derive a stable 32-byte HMAC key from available server environment variables
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const crypto = require('crypto') as typeof import('crypto');
  const serverSeed =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.DATABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXTAUTH_SECRET ||
    'poultry-mgmt-default-production-session-fallback-secret-2026';

  const hash = crypto.createHash('sha256').update(`pfms-session-fallback-${serverSeed}`).digest();
  cachedKey = new Uint8Array(hash);
  return cachedKey;
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'SuperAdmin' | 'Admin' | 'Manager' | 'Staff' | string;
  orgId: string;
  workspaceId: string;
  name?: string;
  tier?: string;
  /** Set only while a SuperAdmin is impersonating a tenant: the SuperAdmin's user id. */
  impersonatedBy?: string;
  impersonatorEmail?: string;
  impersonatedOrgName?: string;
}

/**
 * Signs a cryptographic JWT session token.
 */
export async function signSession(
  payload: SessionPayload,
  expiresInSeconds = 60 * 60 * 24
): Promise<string> {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + expiresInSeconds;

  // Strip undefined values so they don't serialize as null
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== undefined && v !== null) clean[k] = v;
  }

  return await new SignJWT(clean)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .sign(resolveSecret());
}

/**
 * Cryptographically verifies and decodes a JWT session token.
 * Returns null if the signature is invalid, tampered with, or expired.
 */
export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;
  try {
    const { payload } = await jwtVerify(token, resolveSecret(), {
      algorithms: ['HS256'],
    });
    if (!payload || typeof payload.userId !== 'string' || typeof payload.role !== 'string') {
      return null;
    }
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
