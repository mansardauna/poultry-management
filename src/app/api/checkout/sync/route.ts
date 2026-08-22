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
    const { isAnnual = false } = body;
    let targetTier = (body.planTier || 'pro').toLowerCase();
    if (targetTier === 'entrepreneur' || targetTier === 'enterprise_plus') {
      targetTier = 'enterprise';
    }

    let orgId = cookieOrgId || '';

    // Look up or create organization for authenticated user strictly
    if (user?.id) {
      if (!orgId) {
        const { data: memberData } = await serviceRoleClient
          .from('organization_members')
          .select('orgId')
          .eq('userId', user.id)
          .limit(1)
          .maybeSingle();
        orgId = memberData?.orgId || '';
      }

      if (!orgId) {
        const { data: userOrg } = await serviceRoleClient
          .from('organizations')
          .select('id')
          .eq('ownerId', user.id)
          .limit(1)
          .maybeSingle();
        orgId = userOrg?.id || '';
      }

      if (!orgId) {
        orgId = `org_${user.id.replace(/-/g, '').slice(0, 10)}`;
        try {
          await serviceRoleClient.from('organizations').upsert([{
            id: orgId,
            name: `${(user.email || 'User').split('@')[0]}'s Farm`,
            ownerId: user.id,
            subscriptionTier: targetTier,
            subscriptionStatus: 'active'
          }]);
          await serviceRoleClient.from('organization_members').upsert([{
            orgId,
            userId: user.id,
            role: 'Admin'
          }]);
        } catch (_e) {}
      }
    }

    if (!orgId) {
      orgId = 'org_owner_main';
    }

    // Calculate subscription duration
    const now = new Date();
    const durationDays = isAnnual ? 365 : 30;
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // 1. Permanently Save Subscription to Database Organization Record
    await serviceRoleClient
      .from('organizations')
      .upsert([{
        id: orgId,
        subscriptionTier: targetTier,
        subscriptionStatus: 'active',
        subscriptionEndsAt: endsAt,
        updatedAt: now.toISOString(),
      }]);

    // 2. Sync to systemSettings table for workspace
    const workspaceId = `main-${orgId}`;
    await serviceRoleClient
      .from('systemSettings')
      .upsert([{
        id: 'sys-' + orgId,
        workspaceId,
        subscriptionTier: targetTier,
        plan: targetTier,
        cctvEnabled: true,
        aiLoggerEnabled: true,
        exportReportsEnabled: true,
        enterpriseHubEnabled: targetTier === 'enterprise'
      }]);

    // 3. Record Subscription History Entry in subscription_history table
    const subId = `sub_${Date.now()}`;
    const isEnt = targetTier === 'enterprise';
    const amount = isEnt ? (isAnnual ? 432000 : 45000) : (isAnnual ? 144000 : 15000);
    const displayTitle = isEnt ? 'Enterprise & Cooperative' : 'Commercial Pro';
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
    response.cookies.set('pfms_org_id', orgId, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return response;
  } catch (err: any) {
    console.error('Checkout Sync Error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
