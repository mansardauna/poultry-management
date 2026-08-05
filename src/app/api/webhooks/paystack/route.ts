'use strict';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase as serviceRoleClient } from '@/lib/supabase';

/**
 * Paystack Webhook Handler
 * Verifies Paystack HMAC signature and processes online invoice payments and plan subscription upgrades.
 */
export async function POST(request: Request) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-paystack-signature');

    const secretKey = process.env.PAYSTACK_SECRET_KEY || 'sk_test_placeholder';

    // Verify HMAC SHA512 signature if Paystack secret is configured
    if (secretKey && !secretKey.includes('placeholder')) {
      const hash = crypto.createHmac('sha512', secretKey).update(bodyText).digest('hex');
      if (hash !== signature) {
        return NextResponse.json({ error: 'Invalid Paystack signature' }, { status: 400 });
      }
    }

    const event = JSON.parse(bodyText);

    if (event.event === 'charge.success') {
      const data = event.data;
      const metadata = data.metadata || {};
      const amountPaid = data.amount ? data.amount / 100 : 0; // Paystack sends amount in kobo

      // 1. Process Online Invoice Payment
      if (metadata.invoiceId) {
        const invoiceId = metadata.invoiceId;
        const workspaceId = metadata.workspaceId || 'main';

        // Update invoice status to Paid
        await serviceRoleClient
          .from('invoices')
          .update({ status: 'Paid' })
          .eq('id', invoiceId);

        // Fetch invoice details to create corresponding sale entry
        const { data: invData } = await serviceRoleClient
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .single();

        if (invData) {
          const targetSaleId = invData.saleId || `sa${Date.now().toString().slice(-8)}`;
          await serviceRoleClient.from('sales').upsert([{
            id: targetSaleId,
            workspaceId: invData.workspaceId || workspaceId,
            date: new Date().toISOString().split('T')[0],
            type: invData.items?.includes('Chicken') ? 'Chickens' : 'Eggs',
            quantity: invData.quantity || 1,
            totalAmount: invData.totalAmount || amountPaid,
            customerName: invData.customerName || 'Paystack Customer',
            paymentMethod: 'Paystack Online',
            status: 'Paid'
          }]);
        }
      }

      // 2. Process Subscription Upgrade Payment
      if (metadata.planTier || metadata.orgId) {
        const orgId = metadata.orgId || 'org-main';
        const targetTier = metadata.planTier === 'enterprise' ? 'enterprise' : 'pro';
        const isAnnual = metadata.isAnnual === true || metadata.isAnnual === 'true';

        const durationDays = isAnnual ? 365 : 30;
        const now = new Date();
        const endsAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString();

        await serviceRoleClient
          .from('organizations')
          .update({
            subscriptionTier: targetTier,
            subscriptionStatus: 'active',
            subscriptionEndsAt: endsAt,
            updatedAt: now.toISOString(),
          })
          .eq('id', orgId);

        const subId = `sub_${Date.now()}`;
        const planName = targetTier === 'enterprise'
          ? (isAnnual ? 'Enterprise & Coop (Annual)' : 'Enterprise & Coop (Monthly)')
          : (isAnnual ? 'Commercial Pro (Annual)' : 'Commercial Pro (Monthly)');

        await serviceRoleClient.from('subscription_history').insert([{
          id: subId,
          workspaceId: `main-${orgId}`,
          planName,
          amount: amountPaid,
          status: 'Paid',
          receiptUrl: data.receipt_number ? `https://paystack.com/receipt/${data.receipt_number}` : `https://paystack.com/pay/${data.reference}`,
          createdAt: now.toISOString()
        }]);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err: any) {
    console.error('Paystack Webhook Error:', err);
    return NextResponse.json({ error: err?.message || 'Webhook processing failed' }, { status: 500 });
  }
}
