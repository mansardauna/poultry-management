'use strict';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { supabase as adminClient, isSupabaseConfigured } from '@/lib/supabase';
import { createClient } from '@/lib/supabaseServer';
import { attachSession, orgIdFromWorkspace } from '@/lib/sessionCookies';
import type { SessionPayload } from '@/lib/session';
import {
  verifyTwoFactorCode,
  createPending2FAToken,
  getPending2FASession,
  consumePending2FASession,
} from '@/lib/twoFactor';
import { rateLimit, getClientIp } from '@/lib/rateLimit';

const GENERIC_AUTH_ERROR = 'Invalid username/email or password.';

/** bcrypt-only password verification. Plaintext stored values are never accepted. */
async function verifyPassword(plain: string, stored: unknown): Promise<boolean> {
  if (typeof stored !== 'string' || !/^\$2[aby]\$/.test(stored)) return false;
  try {
    return await bcrypt.compare(plain, stored);
  } catch {
    return false;
  }
}

/** Constant-time string comparison (for env-configured credentials). */
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

function parseBranches(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {}
  }
  return [];
}

/** Build a signed session from a `users` table record. Role comes ONLY from the DB record. */
async function createUserSessionResponse(userRec: any, rememberMe: boolean, request: Request) {
  const role: string = userRec.role || 'Admin';
  const isSuperAdmin = role === 'SuperAdmin';

  const workspaceId: string = isSuperAdmin
    ? 'org_superadmin'
    : (userRec.workspaceId || `main-org_${userRec.id}`);

  let orgId: string = isSuperAdmin ? 'org_superadmin' : (userRec.orgId || orgIdFromWorkspace(workspaceId));
  if (!orgId) orgId = workspaceId.startsWith('main-') ? workspaceId.slice(5) : '';

  const payload: SessionPayload = {
    userId: String(userRec.id),
    email: userRec.email || '',
    role,
    orgId,
    workspaceId,
    name: userRec.name || userRec.username || '',
    tier: isSuperAdmin ? 'enterprise' : (userRec.subscriptionTier || 'free'),
  };

  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
  return attachSession(NextResponse.json({ ok: true, role }), payload, { maxAge, request });
}

/** Exported function POST */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rememberMe = Boolean(body?.rememberMe);

  // 0. Handle 2FA Verification via Temp Token
  if (body?.tempToken && body?.twoFactorCode) {
    const pending = getPending2FASession(body.tempToken);
    if (!pending) {
      return NextResponse.json(
        { error: '2FA session has expired. Please sign in again.' },
        { status: 401 },
      );
    }

    const isValid = verifyTwoFactorCode(pending.userRec.twoFactorSecret, body.twoFactorCode);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid 6-digit authentication code. Please check your authenticator app.' },
        { status: 401 },
      );
    }

    consumePending2FASession(body.tempToken);
    return createUserSessionResponse(pending.userRec, rememberMe, request);
  }

  const rawEmailInput = typeof body?.email === 'string'
    ? body.email.trim()
    : typeof body?.username === 'string'
      ? body.username.trim()
      : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!rawEmailInput || !password) {
    return NextResponse.json(
      { error: 'Username/Email and password are required' },
      { status: 400 },
    );
  }

  // Rate limiting: 10 attempts per 15 minutes per IP + user combination
  const clientIp = getClientIp(request);
  const rateLimitKey = `login:${clientIp}:${rawEmailInput.toLowerCase()}`;
  const rateCheck = rateLimit(rateLimitKey, { windowMs: 15 * 60 * 1000, max: 10 });

  if (!rateCheck.success) {
    return NextResponse.json(
      { error: `Too many login attempts. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
    );
  }

  // Reject characters that could alter PostgREST `.or()` filter syntax
  if (/[,()]/.test(rawEmailInput)) {
    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  }

  try {
    const emailInput = rawEmailInput.toLowerCase();
    const isEmailInput = emailInput.includes('@');

    // 1. Primary DB lookup in `users`
    // If user typed an email, query ONLY by exact email. If user typed a username, query ONLY by exact username.
    const userQuery = isEmailInput
      ? adminClient.from('users').select('*').eq('email', emailInput).limit(1)
      : adminClient.from('users').select('*').eq('username', emailInput).limit(1);

    const { data: userRecords } = await userQuery;

    if (userRecords && userRecords.length > 0) {
      const userRec = userRecords[0];
      // Enforce strict exact match between entered credential and stored value
      const isExactMatch = isEmailInput
        ? (userRec.email && userRec.email.trim().toLowerCase() === emailInput)
        : (userRec.username && userRec.username.trim().toLowerCase() === emailInput);

      if (isExactMatch && (await verifyPassword(password, userRec.passwordHash))) {
        const is2FA =
          (userRec.twoFactorEnabled === 'true' || userRec.twoFactorEnabled === true) &&
          Boolean(userRec.twoFactorSecret);

        if (is2FA) {
          const twoFactorCode = typeof body?.twoFactorCode === 'string' ? body.twoFactorCode.trim() : '';
          if (!twoFactorCode) {
            const tempToken = createPending2FAToken(userRec.id, emailInput, userRec);
            return NextResponse.json({
              ok: false,
              requires2FA: true,
              tempToken,
              message: 'Two-factor authentication required',
            });
          }

          if (!verifyTwoFactorCode(userRec.twoFactorSecret, twoFactorCode)) {
            return NextResponse.json(
              { error: 'Invalid 6-digit authentication code. Please check your authenticator app.' },
              { status: 401 },
            );
          }
        }

        return createUserSessionResponse(userRec, rememberMe, request);
      }
    }

    // 2. Staff table lookup (attendants/managers without a `users` row)
    const staffQuery = isEmailInput
      ? adminClient.from('staff').select('*').or(`username.eq.${emailInput},contact.eq.${emailInput}`).limit(1)
      : adminClient.from('staff').select('*').eq('username', emailInput).limit(1);

    const { data: staffRecords } = await staffQuery;

    if (staffRecords && staffRecords.length > 0) {
      const staffRec = staffRecords[0];
      const isStaffExactMatch = isEmailInput
        ? (staffRec.username?.trim().toLowerCase() === emailInput || staffRec.contact?.trim().toLowerCase() === emailInput)
        : (staffRec.username?.trim().toLowerCase() === emailInput);

      if (isStaffExactMatch && (await verifyPassword(password, staffRec.password))) {
        const staffRole = staffRec.role === 'Manager' ? 'Manager' : 'Staff';
        const branches = parseBranches(staffRec.assignedBranches);
        const workspaceId = branches[0] || staffRec.workspaceId || '';
        const orgId = orgIdFromWorkspace(workspaceId || staffRec.workspaceId);

        const payload: SessionPayload = {
          userId: `usr_${staffRec.id}`,
          email: staffRec.username || emailInput,
          role: staffRole,
          orgId,
          workspaceId,
          name: staffRec.name || staffRec.username || '',
          tier: 'free',
        };
        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
        return attachSession(NextResponse.json({ ok: true, role: staffRole }), payload, { maxAge, request });
      }
    }

    // 3. Optional env-configured break-glass SuperAdmin.
    //    Only active when BOTH variables are explicitly set; there is no built-in default.
    const envAdminUser = (process.env.PFMS_ADMIN_USERNAME || '').trim().toLowerCase();
    const envAdminPass = process.env.PFMS_ADMIN_PASSWORD || '';
    if (
      envAdminUser &&
      envAdminPass.length >= 12 &&
      emailInput === envAdminUser &&
      safeEqual(password, envAdminPass)
    ) {
      const payload: SessionPayload = {
        userId: 'env_superadmin',
        email: emailInput.includes('@') ? emailInput : `${envAdminUser}@localhost`,
        role: 'SuperAdmin',
        orgId: 'org_superadmin',
        workspaceId: 'org_superadmin',
        name: 'Super Admin',
        tier: 'enterprise',
      };
      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
      return attachSession(NextResponse.json({ ok: true, role: 'SuperAdmin' }), payload, { maxAge, request });
    }

    // 4. Optional Supabase Auth fallback. Role is resolved from the DB, never from user_metadata.
    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const res = await supabase.auth
          .signInWithPassword({ email: emailInput, password })
          .catch(() => ({ data: { user: null }, error: null }));

        const sbUser = res.data?.user;
        if (sbUser) {
          const { data: dbUser } = await adminClient
            .from('users')
            .select('*')
            .eq('email', sbUser.email || emailInput)
            .limit(1)
            .maybeSingle();

          if (dbUser) {
            return createUserSessionResponse(dbUser, rememberMe, request);
          }

          const workspaceId = `main-org_${sbUser.id.replace(/-/g, '').slice(0, 10)}`;
          const payload: SessionPayload = {
            userId: sbUser.id,
            email: sbUser.email || emailInput,
            role: 'Admin',
            orgId: orgIdFromWorkspace(workspaceId),
            workspaceId,
            tier: 'free',
          };
          const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
          return attachSession(NextResponse.json({ ok: true, role: 'Admin' }), payload, { maxAge, request });
        }
      } catch (_e) {}
    }

    return NextResponse.json({ error: GENERIC_AUTH_ERROR }, { status: 401 });
  } catch (_error) {
    return NextResponse.json(
      { error: 'Internal server error while processing login.' },
      { status: 500 }
    );
  }
}
