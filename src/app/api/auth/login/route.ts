'use strict';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

/** Exported function POST */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Auto-confirm stuck users who hit the rate limit on signup
      if (error.message.toLowerCase().includes('email not confirmed')) {
         const { supabase: adminClient } = await import('@/lib/supabase');
         const { data: usersData } = await adminClient.auth.admin.listUsers();
         const unconfirmedUser = usersData?.users.find(u => u.email === email);
         
         if (unconfirmedUser) {
            await adminClient.auth.admin.updateUserById(unconfirmedUser.id, { email_confirm: true });
            
            // Retry login
            const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({ email, password });
            if (!retryError && retryData.user) {
               return NextResponse.json({ ok: true, role: retryData.user.user_metadata?.role || 'Admin' });
            }
         }
      }

      return NextResponse.json(
        { error: error.message },
        { status: 401 },
      );
    }

    // Next.js response + Supabase cookies are handled automatically by createServerClient
    const userId = data.user?.id;
    if (userId) {
       const { supabase: adminClient } = await import('@/lib/supabase');
       const { data: memberData } = await adminClient.from('organization_members').select('orgId').eq('userId', userId).single();
       if (memberData?.orgId) {
          const orgId = memberData.orgId;
          const { data: orgData } = await adminClient.from('organizations').select('subscriptionTier, subscriptionEndsAt').eq('id', orgId).single();
          
          const endsAt = orgData?.subscriptionEndsAt ? new Date(orgData.subscriptionEndsAt) : null;
          const isExpired = endsAt ? new Date() > endsAt : false;
          let tier = orgData?.subscriptionTier || 'free';

          if (tier === 'pro' && isExpired) {
            tier = 'free';
            await adminClient.from('organizations').update({ subscriptionTier: 'free', subscriptionStatus: 'expired' }).eq('id', orgId);
          }

          const { data: workspaces } = await adminClient.from('workspaces').select('id').like('id', `%${orgId}%`).limit(1);
          const defaultWorkspaceId = workspaces?.[0]?.id || `main-${orgId}`;
          
          const response = NextResponse.json({ ok: true, role: data.user.user_metadata?.role || 'Admin' });
          response.cookies.set('pfms_workspace', defaultWorkspaceId, { path: '/' });
          response.cookies.set('pfms_org_id', orgId, { path: '/' });
          response.cookies.set('pfms_tier', tier, { path: '/' });
          return response;
       }
    }

    return NextResponse.json({ ok: true, role: data.user?.user_metadata?.role || 'Admin' });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { error: 'Internal server error while communicating with the database.' },
      { status: 500 }
    );
  }
}
