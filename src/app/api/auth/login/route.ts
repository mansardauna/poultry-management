'use strict';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
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
            response.cookies.set('pfms_workspace', userRec.workspaceId || 'main-org_owner_main', { path: '/' });
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
    const userClean = emailInput.split('@')[0];

    // Reject deleted staff/manager accounts
    if (userRole === 'Staff' || userRole === 'Manager') {
      const { data: userRecs } = await adminClient
        .from('users')
        .select('id')
        .or(`username.eq.${emailInput},username.eq.${emailInput.toLowerCase()},username.eq.${userClean}`)
        .limit(1);

      const { data: staffRecs } = await adminClient
        .from('staff')
        .select('id')
        .or(`name.eq.${emailInput},contact.eq.${emailInput},username.eq.${userClean}`)
        .limit(1);

      if ((!userRecs || userRecs.length === 0) && (!staffRecs || staffRecs.length === 0)) {
        return NextResponse.json(
          { error: 'This staff account has been removed or revoked by the farm administrator.' },
          { status: 401 }
        );
      }
    }

    // Check metadata first for staff assigned workspace
    let targetWorkspaceId = user.user_metadata?.workspaceId || '';

    // Look up staff member's assigned farm workspace ID from staff table
    if (!targetWorkspaceId) {
      const { data: staffMember } = await adminClient
        .from('staff')
        .select('workspaceId, assignedBranches')
        .or(`username.eq.${userClean},name.eq.${emailInput},contact.eq.${emailInput},name.eq.${userClean}`)
        .limit(1)
        .maybeSingle();

      if (staffMember?.assignedBranches && Array.isArray(staffMember.assignedBranches) && staffMember.assignedBranches.length > 0) {
        targetWorkspaceId = staffMember.assignedBranches[0];
      } else if (staffMember?.workspaceId) {
        targetWorkspaceId = staffMember.workspaceId;
      }
    }

    // Look up workspaceId from users table
    if (!targetWorkspaceId) {
      const { data: userRec } = await adminClient
        .from('users')
        .select('workspaceId')
        .or(`username.eq.${userClean},username.eq.${emailInput},email.eq.${emailInput}`)
        .limit(1)
        .maybeSingle();

      if (userRec?.workspaceId) {
        targetWorkspaceId = userRec.workspaceId;
      }
    }

    let orgId = 'org_owner_main';
    if (user.email === 'owner@poultry.com') {
      await adminClient.from('organization_members').upsert({ orgId, userId, role: 'Admin' });
    } else {
      const { data: memberData } = await adminClient.from('organization_members').select('orgId').eq('userId', userId).maybeSingle();
      if (memberData?.orgId) {
        orgId = memberData.orgId;
      } else if (userRole === 'Admin') {
        orgId = `org_${userId.replace(/-/g, '').slice(0, 10)}`;
      }
    }

    if (!targetWorkspaceId) {
      targetWorkspaceId = user.email === 'owner@poultry.com' ? 'main-org_owner_main' : `main-${orgId}`;
    }

    // Fallback: Verify that targetWorkspaceId exists in workspaces table
    const { data: validWs } = await adminClient.from('workspaces').select('id').eq('id', targetWorkspaceId).maybeSingle();
    if (!validWs) {
      const { data: mainWs } = await adminClient.from('workspaces').select('id').order('createdAt', { ascending: true }).limit(1);
      if (mainWs && mainWs.length > 0) {
        targetWorkspaceId = mainWs[0].id;
      }
    }

    const cookieStore = await cookies();
    const existingCookieTier = (cookieStore.get('pfms_tier')?.value || '').toLowerCase();
    const isEntCookie = existingCookieTier === 'enterprise' || existingCookieTier === 'entrepreneur' || existingCookieTier === 'enterprise_plus';

    const { data: orgData } = await adminClient
      .from('organizations')
      .select('subscriptionTier')
      .eq('id', orgId)
      .limit(1)
      .maybeSingle();

    const { data: sysData } = await adminClient
      .from('systemSettings')
      .select('subscriptionTier, plan')
      .or(`workspaceId.eq.${targetWorkspaceId},workspaceId.eq.${orgId}`)
      .limit(1)
      .maybeSingle();

    let tier = orgData?.subscriptionTier || sysData?.subscriptionTier || sysData?.plan || (user.email === 'owner@poultry.com' ? 'pro' : 'free');

    // Permanent Enterprise tier protection: If user or cookie is Enterprise, NEVER auto-downgrade!
    if (isEntCookie || tier === 'enterprise' || tier === 'entrepreneur' || tier === 'enterprise_plus') {
      tier = 'enterprise';
      
      // Permanently update database record to Enterprise
      try {
        if (orgId) {
          await adminClient.from('organizations').update({ subscriptionTier: 'enterprise' }).eq('id', orgId);
        }
        if (targetWorkspaceId) {
          await adminClient.from('systemSettings').update({ subscriptionTier: 'enterprise', plan: 'enterprise', enterpriseHubEnabled: true }).eq('workspaceId', targetWorkspaceId);
        }
      } catch (_e) {}
    }

    const response = NextResponse.json({ ok: true, role: userRole });
    response.cookies.set('pfms_workspace', targetWorkspaceId, { path: '/' });
    response.cookies.set('pfms_org_id', orgId, { path: '/' });
    response.cookies.set('pfms_tier', tier, { path: '/', maxAge: 60 * 60 * 24 * 365 });
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
