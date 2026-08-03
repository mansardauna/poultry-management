'use strict';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { supabase as serviceRoleClient } from '@/lib/supabase';

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
    // 1. Create the user using admin API to bypass rate limits and auto-confirm
    const { data: adminData, error: adminError } = await serviceRoleClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: role }
    });

    if (adminError) {
      if (adminError.message.includes('already') || adminError.message.includes('registered')) {
        return NextResponse.json({ error: 'User already exists. Please log in.' }, { status: 400 });
      }
      return NextResponse.json({ error: adminError.message }, { status: 400 });
    }

    // 2. Now sign in the user to establish the session (set cookies)
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      return NextResponse.json({ error: signInError.message }, { status: 400 });
    }

    const data = adminData;

    // Now create the organization for the new SaaS user
    const userId = data.user?.id;
    if (userId) {
       const orgId = `org_${Date.now()}`;
       
       const displayName = email.split('@')[0];

       // Use service role client to bypass any RLS for initial setup
       await serviceRoleClient.from('organizations').insert([{
          id: orgId,
          name: `${displayName}'s Farm`,
          ownerId: userId,
          subscriptionTier: 'free',
          subscriptionStatus: 'active'
       }]);
       
       await serviceRoleClient.from('organization_members').insert([{
          orgId,
          userId,
          role: 'Admin'
       }]);

       // Create default workspace (branch) linked to this org. 
       // For now, workspaceId string will just be the ID. In the future, workspaces should reference orgId.
       await serviceRoleClient.from('workspaces').insert([{
          id: `main-${orgId}`,
          name: 'Main Branch',
          type: 'Layer Farm',
          createdAt: new Date().toISOString()
       }]);
    }

    return NextResponse.json({ ok: true, role: role });
  } catch (error: any) {
    console.error('Signup Error:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
}
