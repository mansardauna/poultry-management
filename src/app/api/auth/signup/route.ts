'use strict';
import { NextResponse } from 'next/server';
import { supabase as serviceRoleClient, isSupabaseConfigured } from '@/lib/supabase';
import { createClient } from '@/lib/supabaseServer';
import bcrypt from 'bcryptjs';

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

  try {
    const email = rawEmail.toLowerCase();
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
    await serviceRoleClient.from('users').insert([{
      id: newUserId,
      username: userClean,
      email: email,
      passwordHash: passwordHash,
      role: 'Admin',
      workspaceId: defaultWorkspaceId,
      orgId: orgId
    }]);

    // 3. ALWAYS insert default primary workspace into `workspaces` table
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

    // 5. Return success response with all session cookies
    const response = NextResponse.json({ ok: true, role });
    response.cookies.set('pfms_workspace', defaultWorkspaceId, { path: '/' });
    response.cookies.set('pfms_org_id', orgId, { path: '/' });
    response.cookies.set('pfms_tier', 'free', { path: '/' });
    response.cookies.set('pfms_role', role, { path: '/' });
    response.cookies.set('pfms_email', email, { path: '/' });
    return response;
  } catch (error: any) {
    console.error('Signup Error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error?.message || error}` },
      { status: 500 }
    );
  }
}
