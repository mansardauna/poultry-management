import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase as serviceRoleClient } from '@/lib/supabase';
import { getGatewaysConfig } from '@/lib/gateways';

export async function POST(req: Request) {
  const gateways = await getGatewaysConfig();
  const stripeSecretKey = gateways.stripeSecretKey || process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder';
  const webhookSecret = gateways.stripeWebhookSecret || process.env.STRIPE_WEBHOOK_SECRET || 'whsec_placeholder';

  const stripe = new Stripe(stripeSecretKey);
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  if (!webhookSecret || webhookSecret === 'whsec_placeholder' || webhookSecret.includes('placeholder')) {
    return NextResponse.json({ error: 'Stripe webhook secret is not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook Error: ${(err as Error).message}` }, { status: 400 });
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

        interface StripeSubscriptionData {
          id: string;
          status: string;
          current_period_end?: number;
          items?: { data: Array<{ price?: { id?: string } }> };
        }
        const sub = subscription as unknown as StripeSubscriptionData;
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : new Date().toISOString();
        const planId = sub.items?.data?.[0]?.price?.id || normTier;

        await serviceRoleClient.from('subscriptions').upsert({
          id: sub.id,
          orgId,
          stripeSubscriptionId: sub.id,
          status: sub.status,
          currentPeriodEnd: periodEnd,
          planId
        });

        await serviceRoleClient.from('organizations').update({
          subscriptionTier: normTier,
          subscriptionStatus: subscription.status
        }).eq('id', orgId);

        const workspaceId = `main-${orgId}`;
        await serviceRoleClient.from('systemSettings').upsert([{
          id: 'sys-' + orgId,
          workspaceId,
          subscriptionTier: normTier,
          plan: normTier,
          cctvEnabled: true,
          aiLoggerEnabled: true,
          exportReportsEnabled: true,
          enterpriseHubEnabled: normTier === 'enterprise'
        }]);
      }
      break;
    }
    
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      
      const { data: dbSub } = await serviceRoleClient
        .from('subscriptions')
        .select('orgId')
        .eq('stripeSubscriptionId', subscription.id)
        .limit(1)
        .maybeSingle();
        
      if (dbSub?.orgId) {
        interface StripeSubscriptionData {
          id: string;
          status: string;
          current_period_end?: number;
          items?: { data: Array<{ price?: { id?: string } }> };
        }
        const sub = subscription as unknown as StripeSubscriptionData;
        const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : new Date().toISOString();
        const planId = sub.items?.data?.[0]?.price?.id || 'pro';

        await serviceRoleClient.from('subscriptions').update({
          status: sub.status,
          currentPeriodEnd: periodEnd,
          planId
        }).eq('stripeSubscriptionId', sub.id);

        const newTier = subscription.status === 'active' || subscription.status === 'trialing' ? 'pro' : 'free';
        
        await serviceRoleClient.from('organizations').update({
          subscriptionTier: newTier,
          subscriptionStatus: subscription.status
        }).eq('id', dbSub.orgId);

        const workspaceId = `main-${dbSub.orgId}`;
        await serviceRoleClient.from('systemSettings').upsert([{
          id: 'sys-' + dbSub.orgId,
          workspaceId,
          subscriptionTier: newTier,
          plan: newTier,
          cctvEnabled: newTier !== 'free',
          aiLoggerEnabled: newTier !== 'free',
          exportReportsEnabled: newTier !== 'free'
        }]);
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
