'use strict';
import { NextResponse } from 'next/server';
import { supabase as adminClient, isSupabaseConfigured } from '@/lib/supabase';
import { createClient } from '@/lib/supabaseServer';
import bcrypt from 'bcryptjs';
import {
  verifyTwoFactorCode,
  createPending2FAToken,
  getPending2FASession,
  consumePending2FASession,
} from '@/lib/twoFactor';

/** Helper to issue auth cookies */
function createAuthResponse(userRec: any, emailInput: string, rememberMe: boolean) {
  const isSuperAdminUser =
    userRec.role === 'SuperAdmin' ||
    emailInput === 'owner@poultry.com' ||
    emailInput === 'superadmin@pfms.com';
  const staffRole = isSuperAdminUser ? 'SuperAdmin' : (userRec.role || 'Admin');
  const targetWorkspaceId = isSuperAdminUser
    ? 'org_superadmin'
    : (userRec.workspaceId || `main-org_${userRec.id}`);
  let orgId = isSuperAdminUser ? 'org_superadmin' : (userRec.orgId || '');
  if (!orgId && targetWorkspaceId) {
    const match = targetWorkspaceId.match(/org_[a-zA-Z0-9]+/);
    if (match) orgId = match[0];
  }
  if (!orgId) {
    orgId = targetWorkspaceId.startsWith('main-') ? targetWorkspaceId.slice(5) : 'org_owner_main';
  }
  const tier = isSuperAdminUser ? 'enterprise' : (userRec.subscriptionTier || 'free');

  const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 days if rememberMe, else 24 hours
  const cookieOptions = { path: '/', maxAge, sameSite: 'lax' as const };

  const response = NextResponse.json({ ok: true, role: staffRole });
  response.cookies.set('pfms_workspace', targetWorkspaceId, cookieOptions);
  response.cookies.set('pfms_org_id', orgId, cookieOptions);
  response.cookies.set('pfms_tier', tier, cookieOptions);
  response.cookies.set('pfms_role', staffRole, cookieOptions);
  response.cookies.set('pfms_email', userRec.email || emailInput, cookieOptions);
  response.cookies.set('pfms_name', userRec.name || userRec.username || '', cookieOptions);
  return response;
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
    return createAuthResponse(pending.userRec, pending.email, rememberMe);
  }

  const rawEmailInput = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!rawEmailInput || !password) {
    return NextResponse.json(
      { error: 'Username/Email and password are required' },
      { status: 400 },
    );
  }

  try {
    const emailInput = rawEmailInput.toLowerCase();
    const userClean = emailInput.includes('@') ? emailInput.split('@')[0] : emailInput;

    // 1. Primary DB Table Lookup in `users` (Works for self-hosted DBs & production)
    const { data: userRecords } = await adminClient
      .from('users')
      .select('*')
      .or(`email.eq.${emailInput},username.eq.${emailInput},username.eq.${userClean}`)
      .limit(1);

    if (userRecords && userRecords.length > 0) {
      const userRec = userRecords[0];
      let isPasswordValid = false;
      const storedHash = userRec.passwordHash || '';
      if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
        try {
          isPasswordValid = bcrypt.compareSync(password, storedHash);
        } catch {
          isPasswordValid = false;
        }
      } else {
        isPasswordValid = password === storedHash;
      }

      if (isPasswordValid) {
        // Check if user has 2FA enabled
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

          const isCodeValid = verifyTwoFactorCode(userRec.twoFactorSecret, twoFactorCode);
          if (!isCodeValid) {
            return NextResponse.json(
              { error: 'Invalid 6-digit authentication code. Please check your authenticator app.' },
              { status: 401 },
            );
          }
        }

        return createAuthResponse(userRec, emailInput, rememberMe);
      }
    }

    // 2. Staff Table Lookup (for farm attendants/managers created in onboarding or staff module)
    const { data: staffRecords } = await adminClient
      .from('staff')
      .select('*')
      .or(`username.eq.${emailInput},username.eq.${userClean},name.eq.${emailInput}`)
      .limit(1);

    if (staffRecords && staffRecords.length > 0) {
      const staffRec = staffRecords[0];
      const storedPass = staffRec.password || '';
      let isPasswordValid = false;

      if (storedPass) {
        if (storedPass.startsWith('$2a$') || storedPass.startsWith('$2b$')) {
          try {
            isPasswordValid = bcrypt.compareSync(password, storedPass);
          } catch {
            isPasswordValid = false;
          }
        } else {
          isPasswordValid = password === storedPass;
        }
      }

      if (isPasswordValid) {
        const staffRole = staffRec.role || 'Staff';
        let assignedBranch = staffRec.workspaceId || 'main-org_owner_main';
        if (Array.isArray(staffRec.assignedBranches) && staffRec.assignedBranches[0]) {
          assignedBranch = staffRec.assignedBranches[0];
        } else if (typeof staffRec.assignedBranches === 'string') {
          try {
            const parsed = JSON.parse(staffRec.assignedBranches);
            if (Array.isArray(parsed) && parsed[0]) assignedBranch = parsed[0];
          } catch {}
        }
        let staffOrgId = '';
        const match = (assignedBranch || staffRec.workspaceId || '').match(/org_[a-zA-Z0-9]+/);
        if (match) staffOrgId = match[0];
        if (!staffOrgId) staffOrgId = 'org_owner_main';

        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
        const cookieOptions = { path: '/', maxAge, sameSite: 'lax' as const };

        const response = NextResponse.json({ ok: true, role: staffRole });
        response.cookies.set('pfms_workspace', assignedBranch, cookieOptions);
        response.cookies.set('pfms_org_id', staffOrgId, cookieOptions);
        response.cookies.set('pfms_tier', 'free', cookieOptions);
        response.cookies.set('pfms_role', staffRole, cookieOptions);
        response.cookies.set('pfms_email', staffRec.username || staffRec.name || emailInput, cookieOptions);
        response.cookies.set('pfms_name', staffRec.name || staffRec.username || '', cookieOptions);
        return response;
      }
    }

    // 3. Fallback: Check environment-configured admin credentials
    const adminUser = process.env.PFMS_ADMIN_USERNAME || 'owner';
    const adminPass = process.env.PFMS_ADMIN_PASSWORD || 'PoultryFarm@2026!';
    if (
      (emailInput === adminUser.toLowerCase() || emailInput === 'owner@poultry.com' || userClean === adminUser.toLowerCase()) &&
      password === adminPass
    ) {
      const staffRole = 'SuperAdmin';
      const targetWorkspaceId = 'org_superadmin';
      const orgId = 'org_superadmin';
      const tier = 'enterprise';

      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
      const cookieOptions = { path: '/', maxAge, sameSite: 'lax' as const };

      const response = NextResponse.json({ ok: true, role: staffRole });
      response.cookies.set('pfms_workspace', targetWorkspaceId, cookieOptions);
      response.cookies.set('pfms_org_id', orgId, cookieOptions);
      response.cookies.set('pfms_tier', tier, cookieOptions);
      response.cookies.set('pfms_role', staffRole, cookieOptions);
      response.cookies.set('pfms_email', 'owner@poultry.com', cookieOptions);
      response.cookies.set('pfms_name', 'Super Admin', cookieOptions);
      return response;
    }

    // 4. Optional Supabase Auth Fallback (if explicitly configured and user not found locally)
    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const res = await supabase.auth.signInWithPassword({ email: emailInput, password }).catch(() => ({ data: { user: null }, error: null }));

        if (res.data?.user) {
          const user = res.data.user;
          const userRole = user.user_metadata?.role || 'Admin';
          const targetWorkspaceId = user.user_metadata?.workspaceId || `main-org_${user.id.slice(0, 8)}`;
          const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
          const cookieOptions = { path: '/', maxAge, sameSite: 'lax' as const };

          const response = NextResponse.json({ ok: true, role: userRole });
          response.cookies.set('pfms_workspace', targetWorkspaceId, cookieOptions);
          response.cookies.set('pfms_org_id', `org_${user.id.slice(0, 8)}`, cookieOptions);
          response.cookies.set('pfms_tier', 'free', cookieOptions);
          response.cookies.set('pfms_role', userRole, cookieOptions);
          response.cookies.set('pfms_email', user.email || emailInput, cookieOptions);
          return response;
        }
      } catch (_e) {}
    }

    return NextResponse.json(
      { error: 'Invalid username/email or password.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error while processing login.' },
      { status: 500 }
    );
  }
}
