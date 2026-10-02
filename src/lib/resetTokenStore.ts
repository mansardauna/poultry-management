import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getGatewaysConfig } from './gateways';

interface ResetTokenRecord {
  email: string;
  token: string;
  expiresAt: number;
  verified: boolean;
  createdAt: number;
}

const TOKENS_FILE = path.join(process.cwd(), 'data', 'password_reset_tokens.json');
const TOKEN_EXPIRY_MS = 15 * 60 * 1000; // 15 minutes

function loadTokens(): Record<string, ResetTokenRecord> {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const raw = fs.readFileSync(TOKENS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (_e) {}
  return {};
}

function saveTokens(tokens: Record<string, ResetTokenRecord>) {
  try {
    const dir = path.dirname(TOKENS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokens, null, 2), 'utf8');
  } catch (_e) {}
}

/**
 * Generates a 6-digit verification code for a given email address.
 */
export async function createResetToken(email: string): Promise<{ token: string; emailSent: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  const tokens = loadTokens();

  // Generate 6-digit code
  const token = Math.floor(100000 + crypto.randomInt(900000)).toString();

  tokens[cleanEmail] = {
    email: cleanEmail,
    token,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
    verified: false,
    createdAt: Date.now(),
  };

  saveTokens(tokens);

  // Attempt email delivery via Resend if configured
  let emailSent = false;
  try {
    const config = await getGatewaysConfig();
    if (config.resendApiKey) {
      const fromEmail = config.fromEmail || 'onboarding@resend.dev';
      const appName = config.platformName || 'Poultry Farm Management';
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${appName} <${fromEmail}>`,
          to: [cleanEmail],
          subject: `${appName} - Your Password Reset Verification Code: ${token}`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; rounded: 12px; background: #ffffff;">
              <h2 style="color: #1e1b4b; margin-top: 0;">Password Reset Verification</h2>
              <p style="color: #475569; font-size: 14px; line-height: 1.6;">
                You requested a password reset for your ${appName} account. Use the following 6-digit verification code to complete the process:
              </p>
              <div style="background: #f1f5f9; padding: 18px; text-align: center; border-radius: 8px; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4338ca; font-family: monospace;">
                  ${token}
                </span>
              </div>
              <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
                This code is valid for 15 minutes. If you did not request a password reset, you can safely ignore this email.
              </p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
              <p style="color: #94a3b8; font-size: 11px; text-align: center;">
                &copy; 2026 ${appName}. All rights reserved.
              </p>
            </div>
          `,
        }),
      });
      if (response.ok) {
        emailSent = true;
      }
    }
  } catch (err) {
    console.warn('[resetTokenStore] Failed to send email via Resend:', err);
  }

  return { token, emailSent };
}

/**
 * Validates a reset token. If valid, marks verified = true.
 */
export function verifyResetToken(email: string, token: string): { valid: boolean; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();
  const tokens = loadTokens();

  const record = tokens[cleanEmail];
  if (!record) {
    return { valid: false, error: 'No password reset request found for this email address.' };
  }

  if (Date.now() > record.expiresAt) {
    delete tokens[cleanEmail];
    saveTokens(tokens);
    return { valid: false, error: 'Verification code has expired. Please request a new one.' };
  }

  if (record.token !== cleanToken) {
    return { valid: false, error: 'Invalid verification code. Please check and try again.' };
  }

  // Mark token as verified
  record.verified = true;
  tokens[cleanEmail] = record;
  saveTokens(tokens);

  return { valid: true };
}

/**
 * Checks if the token was verified and consumes (deletes) it upon successful password change.
 */
export function consumeResetToken(email: string, token: string): { valid: boolean; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanToken = token.trim();
  const tokens = loadTokens();

  const record = tokens[cleanEmail];
  if (!record) {
    return { valid: false, error: 'No password reset request found.' };
  }

  if (Date.now() > record.expiresAt) {
    delete tokens[cleanEmail];
    saveTokens(tokens);
    return { valid: false, error: 'Verification code has expired.' };
  }

  if (record.token !== cleanToken) {
    return { valid: false, error: 'Invalid verification code.' };
  }

  if (!record.verified) {
    return { valid: false, error: 'Verification code has not been verified yet.' };
  }

  // Token consumed
  delete tokens[cleanEmail];
  saveTokens(tokens);
  return { valid: true };
}
