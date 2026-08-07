import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const cookieStore = await cookies();
    const cookieOrgId = cookieStore.get('pfms_org_id')?.value;

    const body = await request.json().catch(() => ({}));
    const { planTier = 'pro', isAnnual = false, demo = true } = body;
    const targetTier = planTier || 'pro';

    let orgId = cookieOrgId;

    if (user && !orgId) {
      const { data: memberData } = await serviceRoleClient
        .from('organization_members')
        .select('orgId')
        .eq('userId', user.id)
        .limit(1)
        .single();
      orgId = memberData?.orgId || null;
    }

    if (!orgId) {
      const { data: firstOrg } = await serviceRoleClient
        .from('organizations')
        .select('id')
        .limit(1)
        .single();
      orgId = firstOrg?.id || 'org-main';
    }

    // Calculate subscription duration
    const now = new Date();
    const durationDays = isAnnual ? 365 : 30;
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // Update Organization Tier and Expiration Date
    await serviceRoleClient
      .from('organizations')
      .update({
        subscriptionTier: targetTier,
        subscriptionStatus: 'active',
        subscriptionEndsAt: endsAt,
        updatedAt: now.toISOString(),
      })
      .eq('id', orgId);

    // Sync to systemSettings table
    const workspaceId = `main-${orgId}`;
    const { data: sysSet } = await serviceRoleClient
      .from('systemSettings')
      .select('id')
      .eq('workspaceId', workspaceId)
      .limit(1)
      .maybeSingle();

    if (sysSet) {
      await serviceRoleClient
        .from('systemSettings')
        .update({
          subscriptionTier: targetTier,
          plan: targetTier,
          cctvEnabled: true,
          aiLoggerEnabled: true,
          exportReportsEnabled: true,
          enterpriseHubEnabled: targetTier === 'enterprise' || targetTier === 'entrepreneur'
        })
        .eq('workspaceId', workspaceId);
    } else {
      await serviceRoleClient
        .from('systemSettings')
        .insert([{
          id: 'sys-' + Date.now().toString().slice(-6),
          workspaceId,
          subscriptionTier: targetTier,
          plan: targetTier,
          cctvEnabled: true,
          aiLoggerEnabled: true,
          exportReportsEnabled: true,
          enterpriseHubEnabled: targetTier === 'enterprise' || targetTier === 'entrepreneur'
        }]);
    }

    // Record Subscription History Entry in subscription_history table
    const subId = `sub_${Date.now()}`;
    const isEnt = targetTier === 'enterprise' || targetTier === 'entrepreneur';
    const amount = isEnt ? (isAnnual ? 432000 : 45000) : (isAnnual ? 144000 : 15000);
    const displayTitle = targetTier === 'entrepreneur' ? 'Entrepreneur Plan' : targetTier === 'enterprise' ? 'Enterprise & Coop' : 'Commercial Pro';
    const planName = `${displayTitle} (${isAnnual ? 'Annual' : 'Monthly'})`;

    try {
      await serviceRoleClient.from('subscriptions').upsert([{
        id: subId,
        orgId,
        stripeSubscriptionId: subId,
        status: 'active',
        currentPeriodEnd: endsAt,
        planId: targetTier
      }]);

      await serviceRoleClient.from('subscription_history').insert([{
        id: subId,
        workspaceId,
        planName,
        amount,
        status: 'Paid',
        receiptUrl: `https://pay.stripe.com/receipts/invoices/${subId}`,
        createdAt: now.toISOString()
      }]);
    } catch (e) {
      console.error('Failed to insert into subscriptions / subscription_history table', e);
    }

    // Set Response & Update pfms_tier cookie to targetTier
    const response = NextResponse.json({
      success: true,
      tier: targetTier,
      endsAt,
      durationDays,
      message: `Successfully upgraded to ${displayTitle}!`,
    });

    response.cookies.set('pfms_tier', targetTier, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (err: any) {
    console.error('Checkout Sync Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
