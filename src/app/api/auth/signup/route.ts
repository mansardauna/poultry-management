'use strict';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { supabase as serviceRoleClient } from '@/lib/supabase';

/** Exported function POST */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';
  const role = 'Admin';

  if (!username || !password) {
    return NextResponse.json(
      { error: 'Username and password are required' },
      { status: 400 },
    );
  }

  const email = username.includes('@') ? username : `${username}@poultry.local`;

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: role }
      }
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 },
      );
    }

    // Now create the organization for the new SaaS user
    const userId = data.user?.id;
    if (userId) {
       const orgId = `org_${Date.now()}`;
       
       // Use service role client to bypass any RLS for initial setup
       await serviceRoleClient.from('organizations').insert([{
          id: orgId,
          name: `${username}'s Farm`,
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
