'use strict';
import { NextResponse } from 'next/server';
import { supabase as serviceRoleClient, isSupabaseConfigured } from '@/lib/supabase';
import { createClient } from '@/lib/supabaseServer';
import bcrypt from 'bcryptjs';
import { attachSession } from '@/lib/sessionCookies';

/** Exported function POST */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const rawEmail = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = 'Admin';

  if (!rawEmail || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 },
    );
  }

  if (/[,()\s]/.test(rawEmail) || !rawEmail.includes('@')) {
    return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  }

  const email = rawEmail.toLowerCase();
  const RESERVED_SUPERADMIN_EMAILS = ['owner@poultry.com', 'superadmin@pfms.com', 'admin@pfms.com', 'superadmin@poultry.com'];
  if (RESERVED_SUPERADMIN_EMAILS.includes(email) || email.startsWith('superadmin@') || email === 'owner@poultry.com') {
    return NextResponse.json(
      { error: 'This email address is reserved for system administration. Please register with a different email address.' },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters long.' }, { status: 400 });
  }

  try {
    const userClean = email.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '') || 'user';
    const orgId = `org_${Date.now()}`;
    const defaultWorkspaceId = `main-${orgId}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const newUserId = `u_${Date.now()}`;

    // 1. Check if user already exists by email
    try {
      const { data: existingByEmail } = await serviceRoleClient
        .from('users')
        .select('id, email')
        .eq('email', email)
        .limit(1);

      if (existingByEmail && existingByEmail.length > 0) {
        return NextResponse.json(
          { error: 'An account already exists with this email address. Please log in.' },
          { status: 400 }
        );
      }
    } catch (checkErr) {
      console.warn('[SIGNUP] Email check error (proceeding defensively):', checkErr);
    }

    // Ensure unique username across tenants
    let finalUsername = userClean;
    try {
      const { data: existingByName } = await serviceRoleClient
        .from('users')
        .select('id')
        .eq('username', userClean)
        .limit(1);
      if (existingByName && existingByName.length > 0) {
        finalUsername = `${userClean}_${Math.floor(100 + Math.random() * 900)}`;
      }
    } catch {}

    // 2. ALWAYS insert user into the primary database `users` table
    const { error: userInsertErr } = await serviceRoleClient.from('users').insert([{
      id: newUserId,
      username: finalUsername,
      email: email,
      passwordHash: passwordHash,
      role: 'Admin',
      workspaceId: defaultWorkspaceId,
      orgId: orgId,
      status: 'active',
      subscriptionTier: 'free',
      createdAt: new Date().toISOString()
    }]);

    if (userInsertErr) {
      const errMsg = (userInsertErr as { message?: string })?.message || String(userInsertErr);
      console.error('[SIGNUP] Database error while creating user:', errMsg);
      return NextResponse.json(
        { error: `Database error while creating user: ${errMsg}` },
        { status: 500 }
      );
    }

    // 3. Insert default organization into `organizations` table (aligned with schema.sql)
    try {
      await serviceRoleClient.from('organizations').insert([{
        id: orgId,
        name: `${userClean.charAt(0).toUpperCase() + userClean.slice(1)} Farm`,
        slug: orgId,
        plan: 'starter',
        status: 'active',
        ownerEmail: email,
        createdAt: new Date().toISOString()
      }]);
    } catch (orgErr) {
      console.warn('[SIGNUP] Organization insert warning:', orgErr);
    }

    // 4. Insert default primary workspace into `workspaces` table (aligned with schema.sql)
    try {
      await serviceRoleClient.from('workspaces').insert([{
        id: defaultWorkspaceId,
        orgId: orgId,
        name: 'Main Branch',
        slug: 'main-branch',
        tier: 'free',
        subscriptionPlan: 'Starter',
        subscriptionStatus: 'active',
        isCurrent: 1,
        createdAt: new Date().toISOString()
      }]);
    } catch (wsErr) {
      console.warn('[SIGNUP] Workspace insert warning:', wsErr);
    }

    // 5. Optional Supabase Auth sync (if configured)
    if (isSupabaseConfigured) {
      try {
        await serviceRoleClient.auth.admin.createUser({
          email: email,
          password: password,
          email_confirm: true,
          user_metadata: { role }
        }).catch(() => {});

        const supabase = await createClient();
        await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
      } catch (_e) {}
    }

    // 6. Return success response with a signed session
    return await attachSession(
      NextResponse.json({ ok: true, role, userId: newUserId }),
      {
        userId: newUserId,
        email,
        role,
        orgId,
        workspaceId: defaultWorkspaceId,
        name: finalUsername,
        tier: 'free',
      },
      { request }
    );
  } catch (err) {
    const msg = (err as { message?: string })?.message || String(err);
    console.error('[SIGNUP] Unexpected error:', msg);
    return NextResponse.json(
      { error: `Internal server error: ${msg}` },
      { status: 500 }
    );
  }
}
