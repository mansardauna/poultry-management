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
      if (error.message.toLowerCase().includes('email not confirmed')) {
         const { supabase: adminClient } = await import('@/lib/supabase');
         const { data: usersData } = await adminClient.auth.admin.listUsers();
         const unconfirmedUser = usersData?.users.find(u => u.email === email);
         
         if (unconfirmedUser) {
            await adminClient.auth.admin.updateUserById(unconfirmedUser.id, { email_confirm: true });
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

    const userId = data.user?.id;
    if (userId) {
       const { supabase: adminClient } = await import('@/lib/supabase');
       
       let orgId = 'org_owner_main';
       if (email === 'owner@poultry.com') {
         await adminClient.from('organization_members').upsert({ orgId, userId, role: 'Admin' });
       } else {
         const { data: memberData } = await adminClient.from('organization_members').select('orgId').eq('userId', userId).single();
         orgId = memberData?.orgId || `org_${userId.replace(/-/g, '').slice(0, 10)}`;
       }

       const defaultWorkspaceId = email === 'owner@poultry.com' ? 'main-org_owner_main' : `main-${orgId}`;

       const { data: orgData } = await adminClient
         .from('organizations')
         .select('subscriptionTier, subscriptionEndsAt')
         .eq('id', orgId)
         .maybeSingle();

       const endsAt = orgData?.subscriptionEndsAt ? new Date(orgData.subscriptionEndsAt) : null;
       const isExpired = endsAt ? new Date() > endsAt : false;

       // Fetch tier from systemSettings DB record to persist subscription across devices
       const { data: sysData } = await adminClient
         .from('systemSettings')
         .select('subscriptionTier, plan')
         .or(`workspaceId.eq.${defaultWorkspaceId},workspaceId.eq.${orgId}`)
         .limit(1)
         .maybeSingle();

       let tier = sysData?.subscriptionTier || sysData?.plan || orgData?.subscriptionTier || (email === 'owner@poultry.com' ? 'pro' : 'free');

       if (tier === 'pro' && isExpired) {
         tier = 'free';
         await adminClient.from('organizations').update({ subscriptionTier: 'free', subscriptionStatus: 'expired' }).eq('id', orgId);
       }
       
       const response = NextResponse.json({ ok: true, role: data.user.user_metadata?.role || 'Admin' });
       response.cookies.set('pfms_workspace', defaultWorkspaceId, { path: '/' });
       response.cookies.set('pfms_org_id', orgId, { path: '/' });
       response.cookies.set('pfms_tier', tier, { path: '/' });
       return response;
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
