import crypto from 'crypto';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Encodes a buffer into a base32 string.
 */
function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;

    while (bits >= 5) {
      output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_CHARS[(value << (5 - bits)) & 31];
  }

  return output;
}

/**
 * Decodes a base32 string into a Buffer.
 */
function base32Decode(str: string): Buffer {
  const cleanStr = str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < cleanStr.length; i++) {
    const val = BASE32_CHARS.indexOf(cleanStr[i]);
    if (val === -1) continue;

    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Calculates a 6-digit TOTP code for a given secret and counter.
 */
function getTotpCode(secretBuffer: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  // Big-endian 64-bit integer
  counterBuffer.writeUInt32BE(0, 0);
  counterBuffer.writeUInt32BE(counter, 4);

  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(counterBuffer);
  const digest = hmac.digest();

  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);

  const code = binary % 1000000;
  return code.toString().padStart(6, '0');
}

/**
 * Generates a new 2FA TOTP secret, otpauth URL, and QR Code URL.
 */
export function generateTwoFactorSecret(email: string, appName: string = 'PoultryFarm') {
  const randomBytes = crypto.randomBytes(20);
  const secret = base32Encode(randomBytes).slice(0, 32);

  const cleanAppName = appName.replace(/[^a-zA-Z0-9_-]/g, '') || 'PoultryFarm';
  const cleanEmail = email.trim();
  const otpauthUrl = `otpauth://totp/${encodeURIComponent(cleanAppName)}:${encodeURIComponent(cleanEmail)}?secret=${secret}&issuer=${encodeURIComponent(cleanAppName)}&algorithm=SHA1&digits=6&period=30`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(otpauthUrl)}`;

  return {
    secret,
    otpauthUrl,
    qrCodeUrl,
  };
}

/**
 * Verifies a 6-digit TOTP code against a secret with ±1 time-step (30s) tolerance.
 */
export function verifyTwoFactorCode(secret: string, userCode: string): boolean {
  if (!secret || !userCode) return false;
  const cleanCode = userCode.trim().replace(/\s+/g, '');
  if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) return false;

  try {
    const secretBuffer = base32Decode(secret);
    const now = Math.floor(Date.now() / 1000);
    const currentStep = Math.floor(now / 30);

    // Check steps: current, -1 step (30s ago), +1 step (30s future)
    for (const step of [currentStep, currentStep - 1, currentStep + 1]) {
      const generated = getTotpCode(secretBuffer, step);
      if (generated === cleanCode) {
        return true;
      }
    }
  } catch (_e) {
    return false;
  }

  return false;
}

// Temporary in-memory token cache for pending 2FA logins
const pending2FASessions = new Map<string, { userId: string; email: string; userRec: Record<string, unknown>; expiresAt: number }>();

export function createPending2FAToken(userId: string, email: string, userRec: Record<string, unknown>): string {
  const tempToken = crypto.randomBytes(32).toString('hex');
  pending2FASessions.set(tempToken, {
    userId,
    email,
    userRec,
    expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes validity
  });
  return tempToken;
}

export function getPending2FASession(tempToken: string) {
  const session = pending2FASessions.get(tempToken);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    pending2FASessions.delete(tempToken);
    return null;
  }
  return session;
}

export function consumePending2FASession(tempToken: string) {
  const session = getPending2FASession(tempToken);
  if (session) {
    pending2FASessions.delete(tempToken);
  }
  return session;
}
