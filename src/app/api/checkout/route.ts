import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

// For demonstration, use a fallback price ID if not provided in env.
// In reality, these should be created in the Stripe Dashboard.
const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_monthly_placeholder';
const PRO_ANNUAL_PRICE_ID = process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_annual_placeholder';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    const cookieStore = await cookies();
    const cookieOrgId = cookieStore.get('pfms_org_id')?.value;

    const { planId, isAnnual } = await request.json();
    const targetTier = planId === 'enterprise' ? 'enterprise' : 'pro';

    let orgId: string | null = null;
    let userEmail = 'admin@example.com';

    if (user) {
      userEmail = user.email || userEmail;
      const { data: memberData } = await serviceRoleClient
        .from('organization_members')
        .select('orgId')
        .eq('userId', user.id)
        .limit(1)
        .single();
      orgId = memberData?.orgId || null;
    }

    if (!orgId && cookieOrgId) {
      orgId = cookieOrgId;
    }

    // Workspace cookie fallback
    const workspaceCookie = cookieStore.get('pfms_workspace')?.value;
    if (!orgId && workspaceCookie && workspaceCookie.includes('-')) {
      orgId = workspaceCookie.split('-').slice(1).join('-');
    }

    // Database fallback: fetch first available organization or create default org
    if (!orgId) {
      const { data: firstOrg } = await serviceRoleClient
        .from('organizations')
        .select('id')
        .limit(1)
        .single();

      if (firstOrg?.id) {
        orgId = firstOrg.id;
      } else {
        orgId = 'org-main';
        await serviceRoleClient.from('organizations').insert([{
          id: orgId,
          name: 'Main Farm Organization',
          subscriptionTier: 'free',
          subscriptionStatus: 'active',
          createdAt: new Date().toISOString()
        }]);
      }
    }

    // Check if valid Stripe key is configured
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const isRealStripe = stripeKey && !stripeKey.includes('placeholder');

    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    if (!isRealStripe) {
      // Demo Mode Fallback: Automatically process instant upgrade
      const durationDays = isAnnual ? 365 : 30;
      const now = new Date();
      const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

      await serviceRoleClient
        .from('organizations')
        .update({
          subscriptionTier: targetTier,
          subscriptionStatus: 'active',
          subscriptionEndsAt: endsAt,
        })
        .eq('id', orgId);

      const response = NextResponse.json({ 
        url: `${siteUrl}/dashboard?upgraded=true&tier=${targetTier}&duration=${durationDays}`,
        demo: true 
      });

      response.cookies.set('pfms_tier', targetTier, { path: '/', maxAge: 60 * 60 * 24 * 365 });
      return response;
    }

    // Real Stripe Mode
    const { data: org } = await serviceRoleClient
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    let customerId = org?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { orgId },
      });
      customerId = customer.id;

      await serviceRoleClient
        .from('organizations')
        .update({ stripeCustomerId: customerId })
        .eq('id', orgId);
    }

    // Inline price_data fallback if specific price IDs are not created in Stripe dashboard
    const envPriceId = isAnnual ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID : process.env.STRIPE_PRO_MONTHLY_PRICE_ID;
    
    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = envPriceId ? { price: envPriceId, quantity: 1 } : {
      price_data: {
        currency: 'usd',
        product_data: {
          name: isAnnual ? 'Commercial Pro (Annual Subscription)' : 'Commercial Pro (Monthly Subscription)',
          description: 'Includes Unlimited Branches, CCTV Feed Monitoring, Voice AI, and 24/7 Priority Support.',
        },
        unit_amount: isAnnual ? 12000 : 1500, // $120/yr or $15/mo
        recurring: {
          interval: isAnnual ? 'year' : 'month',
        },
      },
      quantity: 1,
    };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [lineItem],
      mode: 'subscription',
      success_url: `${siteUrl}/dashboard?upgraded=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
      metadata: { orgId, isAnnual: isAnnual ? 'true' : 'false' },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Checkout Route Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to initiate checkout' }, { status: 500 });
  }
}
