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

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters long.' }, { status: 400 });
  }

  try {
    const userClean = email.split('@')[0];
    const orgId = `org_${Date.now()}`;
    const defaultWorkspaceId = `main-${orgId}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const newUserId = `u_${Date.now()}`;

    // 1. Check if user already exists in local database `users` table
    const { data: existingUsers } = await serviceRoleClient
      .from('users')
      .select('*')
      .or(`email.eq.${email},username.eq.${userClean}`)
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: 'An account already exists with this email or username. Please log in.' },
        { status: 400 }
      );
    }

    // 2. ALWAYS insert user into the primary database `users` table
    const { error: userInsertErr } = await serviceRoleClient.from('users').insert([{
      id: newUserId,
      username: userClean,
      email: email,
      passwordHash: passwordHash,
      role: 'Admin',
      workspaceId: defaultWorkspaceId,
      orgId: orgId
    }]);

    if (userInsertErr) {
      return NextResponse.json(
        { error: `Database error while creating user: ${userInsertErr?.message || userInsertErr}` },
        { status: 500 }
      );
    }

    // 3. ALWAYS insert default organization into `organizations` table
    await serviceRoleClient.from('organizations').insert([{
      id: orgId,
      name: `${userClean.charAt(0).toUpperCase() + userClean.slice(1)} Farm Org`,
      subscriptionTier: 'free',
      subscriptionStatus: 'active',
      ownerId: newUserId,
      ownerUsername: userClean,
      ownerEmail: email,
      createdAt: new Date().toISOString()
    }]).catch(() => {});

    // 4. ALWAYS insert default primary workspace into `workspaces` table
    await serviceRoleClient.from('workspaces').insert([{
      id: defaultWorkspaceId,
      name: 'Main Branch',
      type: 'Layer Farm',
      createdAt: new Date().toISOString(),
      ownerUsername: userClean
    }]);

    // 4. Optional Supabase Auth sync (if configured)
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

    // 5. Return success response with a signed session
    return attachSession(
      NextResponse.json({ ok: true, role }),
      {
        userId: newUserId,
        email,
        role,
        orgId,
        workspaceId: defaultWorkspaceId,
        name: userClean,
        tier: 'free',
      },
      { request }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: `Internal server error: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
