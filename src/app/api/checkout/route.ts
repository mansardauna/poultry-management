import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAuthUser } from '@/lib/auth';
import { supabase as serviceRoleClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2026-07-29.dahlia',
});

// For demonstration, use a fallback price ID if not provided in env.
// In reality, these should be created in the Stripe Dashboard.
const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_monthly_placeholder';
const PRO_ANNUAL_PRICE_ID = process.env.STRIPE_PRO_ANNUAL_PRICE_ID || 'price_annual_placeholder';

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { planId, isAnnual } = await request.json();
    if (planId !== 'pro') {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    // Get the user's organization
    const { data: memberData } = await serviceRoleClient
      .from('organization_members')
      .select('orgId')
      .eq('userId', user.id)
      .limit(1)
      .single();

    if (!memberData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const orgId = memberData.orgId;

    const { data: org } = await serviceRoleClient
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();

    let customerId = org?.stripeCustomerId;

    if (!customerId) {
      // Create a new Stripe Customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          orgId,
        },
      });
      customerId = customer.id;

      // Save it to the DB
      await serviceRoleClient
        .from('organizations')
        .update({ stripeCustomerId: customerId })
        .eq('id', orgId);
    }

    // Create Checkout Session
    const priceId = isAnnual ? PRO_ANNUAL_PRICE_ID : PRO_MONTHLY_PRICE_ID;
    
    // Fallback URL mechanism if NEXT_PUBLIC_SITE_URL is not set
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${siteUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/pricing`,
      metadata: {
        orgId,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Checkout Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
