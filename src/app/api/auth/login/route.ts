'use strict';
import { NextResponse } from 'next/server';
import { supabase as adminClient, isSupabaseConfigured } from '@/lib/supabase';
import { createClient } from '@/lib/supabaseServer';
import bcrypt from 'bcryptjs';

/** Exported function POST */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
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
        const staffRole = userRec.role || 'Admin';
        const targetWorkspaceId = userRec.workspaceId || `main-org_${userRec.id}`;
        const orgId = userRec.orgId || (targetWorkspaceId.startsWith('main-') ? targetWorkspaceId.slice(5) : 'org_owner_main');
        const tier = userRec.subscriptionTier || (emailInput === 'owner@poultry.com' ? 'pro' : 'free');

        const response = NextResponse.json({ ok: true, role: staffRole });
        response.cookies.set('pfms_workspace', targetWorkspaceId, { path: '/' });
        response.cookies.set('pfms_org_id', orgId, { path: '/' });
        response.cookies.set('pfms_tier', tier, { path: '/', maxAge: 60 * 60 * 24 * 365 });
        response.cookies.set('pfms_role', staffRole, { path: '/' });
        response.cookies.set('pfms_email', userRec.email || emailInput, { path: '/' });
        response.cookies.set('pfms_name', userRec.name || userRec.username || '', { path: '/' });
        return response;
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
        const assignedBranch = (Array.isArray(staffRec.assignedBranches) && staffRec.assignedBranches[0]) || staffRec.workspaceId || 'main-org_owner_main';

        const response = NextResponse.json({ ok: true, role: staffRole });
        response.cookies.set('pfms_workspace', assignedBranch, { path: '/' });
        response.cookies.set('pfms_org_id', 'org_owner_main', { path: '/' });
        response.cookies.set('pfms_tier', 'free', { path: '/', maxAge: 60 * 60 * 24 * 365 });
        response.cookies.set('pfms_role', staffRole, { path: '/' });
        response.cookies.set('pfms_email', staffRec.username || staffRec.name || emailInput, { path: '/' });
        response.cookies.set('pfms_name', staffRec.name || staffRec.username || '', { path: '/' });
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
      const staffRole = 'Admin';
      const targetWorkspaceId = 'main-org_owner_main';
      const orgId = 'org_owner_main';
      const tier = 'pro';

      const response = NextResponse.json({ ok: true, role: staffRole });
      response.cookies.set('pfms_workspace', targetWorkspaceId, { path: '/' });
      response.cookies.set('pfms_org_id', orgId, { path: '/' });
      response.cookies.set('pfms_tier', tier, { path: '/', maxAge: 60 * 60 * 24 * 365 });
      response.cookies.set('pfms_role', staffRole, { path: '/' });
      response.cookies.set('pfms_email', 'owner@poultry.com', { path: '/' });
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
          const response = NextResponse.json({ ok: true, role: userRole });
          response.cookies.set('pfms_workspace', targetWorkspaceId, { path: '/' });
          response.cookies.set('pfms_org_id', `org_${user.id.slice(0, 8)}`, { path: '/' });
          response.cookies.set('pfms_tier', 'free', { path: '/', maxAge: 60 * 60 * 24 * 365 });
          response.cookies.set('pfms_role', userRole, { path: '/' });
          response.cookies.set('pfms_email', user.email || emailInput, { path: '/' });
          return response;
        }
      } catch (_e) {}
    }

    return NextResponse.json(
      { error: 'Invalid username/email or password.' },
      { status: 401 }
    );
  } catch (error: any) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing login.' },
      { status: 500 }
    );
  }
}
