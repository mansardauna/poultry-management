'use strict';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { isSupabaseConfigured, supabase as adminClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

/** Exported function POST */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const emailInput = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!emailInput || !password) {
    return NextResponse.json(
      { error: 'Username/Email and password are required' },
      { status: 400 },
    );
  }

  try {
    let authResult: any = null;
    let authError: any = null;

    // 1. Try Supabase Auth sign in only if Supabase is valid & configured
    if (isSupabaseConfigured) {
      try {
        const supabase = await createClient();
        const targetEmails = [
          emailInput,
          emailInput.includes('@') ? emailInput : `${emailInput}@farm.local`
        ];

        for (const em of targetEmails) {
          const res = await supabase.auth.signInWithPassword({ email: em, password }).catch((e: any) => ({ data: { user: null }, error: e }));
          if (!res.error && res.data?.user) {
            authResult = res.data;
            authError = null;
            break;
          } else {
            authError = res.error;
          }
        }
      } catch (err: any) {
        authError = err;
      }
    }

    // 2. Database table lookup for users/staff credentials (runs in local DB mode or when Supabase Auth fails)
    if (!authResult?.user) {
      const userClean = emailInput.split('@')[0].toLowerCase();
      const { data: userRecords } = await adminClient
        .from('users')
        .select('*')
        .or(`username.eq.${emailInput},username.eq.${emailInput.toLowerCase()},username.eq.${userClean},email.eq.${emailInput}`)
        .limit(1);

      if (userRecords && userRecords.length > 0) {
        const userRec = userRecords[0];
        const isPasswordValid = bcrypt.compareSync(password, userRec.passwordHash || '');

        if (isPasswordValid) {
          const staffRole = userRec.role || 'Staff';
          const targetWorkspaceId = userRec.workspaceId || 'main-org_owner_main';
          const orgId = userRec.orgId || (targetWorkspaceId.startsWith('main-') ? targetWorkspaceId.slice(5) : 'org_owner_main');
          const tier = userRec.subscriptionTier || (emailInput === 'owner@poultry.com' ? 'pro' : 'free');

          const response = NextResponse.json({ ok: true, role: staffRole });
          response.cookies.set('pfms_workspace', targetWorkspaceId, { path: '/' });
          response.cookies.set('pfms_org_id', orgId, { path: '/' });
          response.cookies.set('pfms_tier', tier, { path: '/', maxAge: 60 * 60 * 24 * 365 });
          response.cookies.set('pfms_role', staffRole, { path: '/' });
          response.cookies.set('pfms_email', userRec.username || emailInput, { path: '/' });
          return response;
        }
      }
    }

    if (!authResult?.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid username/email or password.' },
        { status: 401 },
      );
    }

    // 3. Successful Supabase Auth Login - Set cookies & headers
    const user = authResult.user;
    const userId = user.id;
    const userRole = user.user_metadata?.role || (emailInput === 'owner@poultry.com' ? 'Admin' : 'Staff');

    let targetWorkspaceId = user.user_metadata?.workspaceId || '';
    if (!targetWorkspaceId) {
      targetWorkspaceId = user.email === 'owner@poultry.com' ? 'main-org_owner_main' : `main-org_${userId.slice(0, 8)}`;
    }

    const response = NextResponse.json({ ok: true, role: userRole });
    response.cookies.set('pfms_workspace', targetWorkspaceId, { path: '/' });
    response.cookies.set('pfms_org_id', `org_${userId.slice(0, 8)}`, { path: '/' });
    response.cookies.set('pfms_tier', 'free', { path: '/', maxAge: 60 * 60 * 24 * 365 });
    response.cookies.set('pfms_role', userRole, { path: '/' });
    response.cookies.set('pfms_email', user.email || emailInput, { path: '/' });
    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing login.' },
      { status: 500 }
    );
  }
}
