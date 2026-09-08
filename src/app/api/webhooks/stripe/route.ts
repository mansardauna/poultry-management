import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase as serviceRoleClient } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

export async function POST(req: Request) {
  if (webhookSecret === 'whsec_placeholder') {
    return NextResponse.json({ error: 'Stripe webhook secret is not configured. Events cannot be verified.' }, { status: 400 });
  }

  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook Error: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const subscriptionId = session.subscription as string;
      const orgId = session.metadata?.orgId;

      if (orgId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const targetTier = (session.metadata?.planId || session.metadata?.planTier || 'pro').toLowerCase();
        const normTier = (targetTier === 'enterprise' || targetTier === 'entrepreneur' || targetTier === 'enterprise_plus') ? 'enterprise' : 'pro';

        const subAny = subscription as any;
        await serviceRoleClient.from('subscriptions').upsert({
          id: subAny.id,
          orgId,
          stripeSubscriptionId: subAny.id,
          status: subAny.status,
          currentPeriodEnd: new Date(subAny.current_period_end * 1000).toISOString(),
          planId: subAny.items.data[0].price.id
        });

        await serviceRoleClient.from('organizations').update({
          subscriptionTier: normTier,
          subscriptionStatus: subscription.status
        }).eq('id', orgId);

        const workspaceId = `main-${orgId}`;
        await serviceRoleClient.from('systemSettings').upsert([{
          workspaceId,
          subscriptionTier: normTier,
          plan: normTier,
          cctvEnabled: true,
          aiLoggerEnabled: true,
          exportReportsEnabled: true,
          enterpriseHubEnabled: normTier === 'enterprise'
        }], { onConflict: 'workspaceId' });
      }
      break;
    }
    
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const subAny = subscription as any;
      
      const { data: dbSub } = await serviceRoleClient
        .from('subscriptions')
        .select('orgId')
        .eq('stripeSubscriptionId', subAny.id)
        .limit(1)
        .maybeSingle();
        
      if (dbSub?.orgId) {
        await serviceRoleClient.from('subscriptions').update({
          status: subAny.status,
          currentPeriodEnd: new Date(subAny.current_period_end * 1000).toISOString(),
          planId: subAny.items.data[0].price.id
        }).eq('stripeSubscriptionId', subAny.id);

        // Only downgrade to free on definitive cancellation states. Transient states
        // like past_due/paused keep the current tier, and enterprise stays unchanged.
        const { data: orgRow } = await serviceRoleClient
          .from('organizations')
          .select('subscriptionTier')
          .eq('id', dbSub.orgId)
          .limit(1)
          .maybeSingle();

        const wasEnterprise = ['enterprise', 'entrepreneur', 'enterprise_plus'].includes(((orgRow?.subscriptionTier as string) || '').toLowerCase());
        const isDefinitivelyCanceled = subscription.status === 'canceled' || subscription.status === 'unpaid';
        const newTier = isDefinitivelyCanceled ? 'free' : (wasEnterprise ? 'enterprise' : 'pro');

        await serviceRoleClient.from('organizations').update({
          subscriptionTier: newTier,
          subscriptionStatus: subscription.status
        }).eq('id', dbSub.orgId);

        const workspaceId = `main-${dbSub.orgId}`;
        await serviceRoleClient.from('systemSettings').upsert([{
          workspaceId,
          subscriptionTier: newTier,
          plan: newTier,
          cctvEnabled: newTier !== 'free',
          aiLoggerEnabled: newTier !== 'free',
          exportReportsEnabled: newTier !== 'free'
        }], { onConflict: 'workspaceId' });
      }
      break;
    }
    default:
      console.warn(`Unhandled Stripe event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
