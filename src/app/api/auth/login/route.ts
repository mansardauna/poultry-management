'use strict';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
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
    const supabase = await createClient();
    const { supabase: adminClient } = await import('@/lib/supabase');

    const targetEmails = [
      emailInput,
      emailInput.includes('@') ? emailInput : `${emailInput}@farm.local`
    ];

    let authResult: any = null;
    let authError: any = null;

    // 1. Try Supabase Auth sign in with provided input or normalized email
    for (const em of targetEmails) {
      const res = await supabase.auth.signInWithPassword({
        email: em,
        password,
      });

      if (!res.error && res.data?.user) {
        authResult = res.data;
        authError = null;
        break;
      } else {
        authError = res.error;
      }
    }

    // 2. Handle unconfirmed email auto-confirmation if needed
    if (authError && authError.message.toLowerCase().includes('email not confirmed')) {
      const { data: usersData } = await adminClient.auth.admin.listUsers();
      const unconfirmedUser = usersData?.users.find(u => 
        u.email?.toLowerCase() === emailInput.toLowerCase() || 
        u.email?.toLowerCase() === `${emailInput.toLowerCase()}@farm.local`
      );

      if (unconfirmedUser) {
        await adminClient.auth.admin.updateUserById(unconfirmedUser.id, { email_confirm: true });
        const retryRes = await supabase.auth.signInWithPassword({
          email: unconfirmedUser.email!,
          password,
        });
        if (!retryRes.error && retryRes.data.user) {
          authResult = retryRes.data;
          authError = null;
        }
      }
    }

    // 3. Fallback: Search `users` database table for Staff / Manager credentials
    if (authError || !authResult?.user) {
      const { data: userRecords } = await adminClient
        .from('users')
        .select('*')
        .or(`username.eq.${emailInput},username.eq.${emailInput.toLowerCase()}`)
        .limit(1);

      if (userRecords && userRecords.length > 0) {
        const userRec = userRecords[0];
        const isPasswordValid = bcrypt.compareSync(password, userRec.passwordHash || '');

        if (isPasswordValid) {
          const staffRole = userRec.role || 'Staff';
          const staffEmail = userRec.username.includes('@') ? userRec.username : `${userRec.username}@farm.local`;

          // Auto-sync into Supabase Auth so standard session cookies work
          try {
            const { data: usersData } = await adminClient.auth.admin.listUsers();
            const existingAuth = usersData?.users.find(u => u.email?.toLowerCase() === staffEmail.toLowerCase());

            if (existingAuth) {
              await adminClient.auth.admin.updateUserById(existingAuth.id, {
                password: password,
                email_confirm: true,
                user_metadata: { role: staffRole }
              });
            } else {
              await adminClient.auth.admin.createUser({
                email: staffEmail,
                password: password,
                email_confirm: true,
                user_metadata: { role: staffRole }
              });
            }

            const signInRes = await supabase.auth.signInWithPassword({
              email: staffEmail,
              password: password
            });

            if (signInRes.data?.user) {
              authResult = signInRes.data;
              authError = null;
            }
          } catch (_e) {
            console.error('Auto auth sync error:', _e);
          }

          if (!authResult) {
            const response = NextResponse.json({ ok: true, role: staffRole });
            response.cookies.set('pfms_role', staffRole, { path: '/' });
            response.cookies.set('pfms_workspace', 'main', { path: '/' });
            return response;
          }
        }
      }
    }

    if (authError || !authResult?.user) {
      return NextResponse.json(
        { error: authError?.message || 'Invalid username/email or password.' },
        { status: 401 },
      );
    }

    // 4. Successful Login - Set role and workspace cookies
    const user = authResult.user;
    const userId = user.id;
    const userRole = user.user_metadata?.role || (emailInput === 'owner@poultry.com' ? 'Admin' : 'Staff');

    let orgId = 'org_owner_main';
    if (user.email === 'owner@poultry.com') {
      await adminClient.from('organization_members').upsert({ orgId, userId, role: 'Admin' });
    } else {
      const { data: memberData } = await adminClient.from('organization_members').select('orgId').eq('userId', userId).maybeSingle();
      orgId = memberData?.orgId || `org_${userId.replace(/-/g, '').slice(0, 10)}`;
    }

    const defaultWorkspaceId = user.email === 'owner@poultry.com' ? 'main-org_owner_main' : `main-${orgId}`;

    const { data: sysData } = await adminClient
      .from('systemSettings')
      .select('subscriptionTier, plan')
      .or(`workspaceId.eq.${defaultWorkspaceId},workspaceId.eq.${orgId}`)
      .limit(1)
      .maybeSingle();

    let tier = sysData?.subscriptionTier || sysData?.plan || (user.email === 'owner@poultry.com' ? 'pro' : 'free');

    const response = NextResponse.json({ ok: true, role: userRole });
    response.cookies.set('pfms_workspace', defaultWorkspaceId, { path: '/' });
    response.cookies.set('pfms_org_id', orgId, { path: '/' });
    response.cookies.set('pfms_tier', tier, { path: '/' });
    response.cookies.set('pfms_role', userRole, { path: '/' });
    return response;
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while communicating with the database.' },
      { status: 500 }
    );
  }
}
