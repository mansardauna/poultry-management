'use strict';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { isSupabaseConfigured, supabase as serviceRoleClient } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

/** Exported function POST */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = 'Admin';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 },
    );
  }

  try {
    const userClean = email.split('@')[0].toLowerCase();
    const orgId = `org_${Date.now()}`;
    const defaultWorkspaceId = `main-${orgId}`;

    // 1. If Supabase Auth is configured, register with Supabase Auth
    if (isSupabaseConfigured) {
      const { data: adminData, error: adminError } = await serviceRoleClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role }
      });

      if (adminError) {
        if (adminError.message.includes('already') || adminError.message.includes('registered')) {
          return NextResponse.json({ error: 'User already exists. Please log in.' }, { status: 400 });
        }
        return NextResponse.json({ error: adminError.message }, { status: 400 });
      }

      const supabase = await createClient();
      await supabase.auth.signInWithPassword({ email, password }).catch(() => {});

      const userId = adminData.user?.id;
      if (userId) {
        await serviceRoleClient.from('organizations').insert([{
          id: orgId,
          name: `${userClean}'s Farm`,
          ownerId: userId,
          subscriptionTier: 'free',
          subscriptionStatus: 'active'
        }]);

        await serviceRoleClient.from('organization_members').insert([{
          orgId,
          userId,
          role: 'Admin'
        }]);

        await serviceRoleClient.from('workspaces').insert([{
          id: defaultWorkspaceId,
          name: 'Main',
          type: 'Layer Farm',
          createdAt: new Date().toISOString(),
          ownerUsername: userClean
        }]);
      }
    } else {
      // 2. Local Database / Zero-Config Mode Signup
      const passwordHash = bcrypt.hashSync(password, 10);
      const newUserId = `u_${Date.now()}`;

      await serviceRoleClient.from('users').insert([{
        id: newUserId,
        username: userClean,
        email,
        passwordHash,
        role: 'Admin',
        workspaceId: defaultWorkspaceId,
        orgId
      }]);

      await serviceRoleClient.from('workspaces').insert([{
        id: defaultWorkspaceId,
        name: 'Main',
        type: 'Layer Farm',
        createdAt: new Date().toISOString(),
        ownerUsername: userClean
      }]);
    }

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
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
