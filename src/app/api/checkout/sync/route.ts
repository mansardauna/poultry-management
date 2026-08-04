import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isAnnual, demo } = await request.json();

    // 1. Fetch user's organization
    const { data: memberData } = await serviceRoleClient
      .from('organization_members')
      .select('orgId')
      .eq('userId', user.id)
      .limit(1)
      .single();

    if (!memberData?.orgId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const orgId = memberData.orgId;

    // 2. Calculate subscription duration
    const now = new Date();
    const durationDays = isAnnual ? 365 : 30;
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // 3. Update Organization Tier and Expiration Date
    const { error: updateErr } = await serviceRoleClient
      .from('organizations')
      .update({
        subscriptionTier: 'pro',
        subscriptionStatus: 'active',
        subscriptionEndsAt: endsAt,
        updatedAt: now.toISOString(),
      })
      .eq('id', orgId);

    if (updateErr) {
      console.error('Failed to update organization tier:', updateErr);
      // Fallback: try update without subscriptionEndsAt if column doesn't exist yet
      await serviceRoleClient
        .from('organizations')
        .update({
          subscriptionTier: 'pro',
          subscriptionStatus: 'active',
        })
        .eq('id', orgId);
    }

    // 4. Record Subscription History Entry
    const subId = `sub_${Date.now()}`;
    await serviceRoleClient.from('subscriptions').insert({
      id: subId,
      orgId,
      stripeSubscriptionId: demo ? `demo_${subId}` : subId,
      status: 'active',
      currentPeriodEnd: endsAt,
      planId: isAnnual ? 'pro_annual' : 'pro_monthly',
    });

    // 5. Create Response & Update pfms_tier cookie to 'pro'
    const response = NextResponse.json({
      success: true,
      tier: 'pro',
      endsAt,
      durationDays,
      message: `Successfully upgraded to Commercial Pro for ${durationDays} days!`,
    });

    response.cookies.set('pfms_tier', 'pro', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (err: any) {
    console.error('Checkout Sync Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
