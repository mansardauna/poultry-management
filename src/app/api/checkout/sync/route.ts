import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { getGatewaysConfig } from '@/lib/gateways';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const cookieStore = await cookies();
    const cookieOrgId = cookieStore.get('pfms_org_id')?.value;

    const body = await request.json().catch(() => ({}));
    const sessionId = body.sessionId || body.session_id;

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json({
        error: 'A verified Stripe session ID is required to upgrade your account.'
      }, { status: 400 });
    }

    // Retrieve configured Stripe gateway key dynamically
    const gateways = await getGatewaysConfig();
    const stripeSecretKey = gateways.stripeSecretKey?.trim();

    if (!stripeSecretKey || stripeSecretKey.includes('placeholder')) {
      return NextResponse.json({
        error: 'Payment gateway is not properly configured on this server.'
      }, { status: 503 });
    }

    const stripe = new Stripe(stripeSecretKey);

    // Retrieve and verify the checkout session from Stripe
    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (_err) {
      return NextResponse.json({
        error: 'Invalid or expired payment session ID.'
      }, { status: 400 });
    }

    const isPaid = session.payment_status === 'paid' || session.status === 'complete';
    if (!isPaid) {
      return NextResponse.json({
        error: 'Payment has not been completed. Upgrade declined.'
      }, { status: 400 });
    }

    // Extract metadata from verified session
    const metaOrgId = session.metadata?.orgId;
    let targetTier = (session.metadata?.planId || 'pro').toLowerCase();
    if (targetTier === 'entrepreneur' || targetTier === 'enterprise_plus') {
      targetTier = 'enterprise';
    }
    const isAnnual = session.metadata?.isAnnual === 'true';

    let orgId = metaOrgId || cookieOrgId || '';

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
    }

    if (!orgId) {
      orgId = 'org-main';
    }

    // Calculate subscription duration
    const now = new Date();
    const durationDays = isAnnual ? 365 : 30;
    const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    // 1. Permanently update Organization subscription in database
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

    // 3. Record subscription & transaction history
    const stripeSubId = (typeof session.subscription === 'string' ? session.subscription : null) || session.id;
    const isEnt = targetTier === 'enterprise';
    const amount = isEnt ? (isAnnual ? 432000 : 45000) : (isAnnual ? 144000 : 15000);
    const displayTitle = isEnt ? 'Enterprise & Cooperative' : 'Commercial Pro';
    const planName = `${displayTitle} (${isAnnual ? 'Annual' : 'Monthly'})`;

    try {
      await serviceRoleClient.from('subscriptions').upsert([{
        id: stripeSubId,
        orgId,
        stripeSubscriptionId: stripeSubId,
        status: 'active',
        currentPeriodEnd: endsAt,
        planId: targetTier
      }]);

      await serviceRoleClient.from('subscription_history').insert([{
        id: stripeSubId,
        workspaceId,
        planName,
        amount,
        status: 'Paid',
        receiptUrl: `https://pay.stripe.com/receipts/invoices/${stripeSubId}`,
        createdAt: now.toISOString()
      }]);
    } catch (_e) {
      // Graceful fallback if history logging fails
    }

    // Set Response & Update pfms_tier cookie to targetTier
    const response = NextResponse.json({
      success: true,
      tier: targetTier,
      endsAt,
      durationDays,
      message: `Payment verified! Successfully upgraded to ${displayTitle}.`,
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
  } catch (err) {
    return NextResponse.json({ error: (err as { message?: string })?.message || 'Internal server error verifying payment' }, { status: 500 });
  }
}
