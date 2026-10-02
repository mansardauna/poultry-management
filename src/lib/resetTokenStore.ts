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
 * Generates and sends a 6-digit verification code using the SuperAdmin configured email provider.
 * If the provider is not configured or sending fails, returns an error without storing the token.
 */
export async function createResetToken(
  email: string,
): Promise<{ token: string; emailSent: boolean; error?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Verify SuperAdmin Email Provider Configuration
  const config = await getGatewaysConfig();
  if (!config.resendApiKey || !config.resendApiKey.trim()) {
    return {
      token: '',
      emailSent: false,
      error:
        'Email service provider is not configured. Please contact the SuperAdmin or configure the Resend API Key in SuperAdmin Gateway Settings.',
    };
  }

  // 2. Generate 6-digit verification code
  const token = Math.floor(100000 + crypto.randomInt(900000)).toString();
  const fromEmail = config.fromEmail?.trim() || 'support@pfms-poultry.com';
  const appName = config.platformName || 'Poultry Farm Management';

  // 3. Dispatch Email via the SuperAdmin configured Resend Provider
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${appName} <${fromEmail}>`,
        to: [cleanEmail],
        subject: `${appName} - Your Password Reset Verification Code: ${token}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <h2 style="color: #1e1b4b; margin-top: 0; font-size: 20px;">Password Reset Verification</h2>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              You requested a password reset for your ${appName} account (${cleanEmail}). Enter the following 6-digit verification code to complete the reset:
            </p>
            <div style="background: #f1f5f9; padding: 18px; text-align: center; border-radius: 8px; margin: 24px 0;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4338ca; font-family: monospace;">
                ${token}
              </span>
            </div>
            <p style="color: #64748b; font-size: 12px; line-height: 1.5;">
              This code will expire in 15 minutes. If you did not request this code, you can safely ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 11px; text-align: center;">
              &copy; 2026 ${appName}. All rights reserved.
            </p>
          </div>
        `,
      }),
    });

    const resJson = await response.json().catch(() => null);

    if (!response.ok) {
      const errMsg =
        resJson?.message ||
        `Email dispatch failed (HTTP ${response.status}). Please check your Resend API configuration.`;
      return {
        token: '',
        emailSent: false,
        error: errMsg,
      };
    }
  } catch (err: any) {
    return {
      token: '',
      emailSent: false,
      error: err?.message || 'Network error while attempting to reach email provider.',
    };
  }

  // 4. Save token only after successful dispatch
  const tokens = loadTokens();
  tokens[cleanEmail] = {
    email: cleanEmail,
    token,
    expiresAt: Date.now() + TOKEN_EXPIRY_MS,
    verified: false,
    createdAt: Date.now(),
  };
  saveTokens(tokens);

  return { token, emailSent: true };
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
