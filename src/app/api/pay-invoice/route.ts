'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';
import { getGatewaysConfig } from '@/lib/gateways';
import { rateLimit, getClientIp } from '@/lib/rateLimit';
import {
  isSimulatedReference,
  simulatedPaymentsAllowed,
  resolveOfflineDecision,
  canModifyWorkspaceInvoice,
  validatePaystackVerification,
  storedReferenceFor,
  isDuplicateKeyError,
  type PaystackVerifyPayload,
} from '@/lib/invoicePaymentPolicy';

const OFFLINE_METHODS = ['Bank Transfer', 'Cash', 'POS'];

export async function POST(request: Request) {
  try {
    // 0. Rate limiting: per IP, plus per invoice (IP headers can be spoofed/rotated)
    const clientIp = getClientIp(request);
    const rateCheck = rateLimit(`pay_invoice:${clientIp}`, { windowMs: 15 * 60 * 1000, max: 30 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: `Too many payment requests. Please try again in ${rateCheck.retryAfterSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    const invoiceId = typeof body.invoiceId === 'string' ? body.invoiceId.trim() : '';
    const reference = typeof body.reference === 'string' ? body.reference : '';
    const action = typeof body.action === 'string' ? body.action : undefined;
    const paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod.slice(0, 100) : undefined;
    const newStatus = body.newStatus;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
    }

    const invoiceRate = rateLimit(`pay_invoice_id:${invoiceId}`, { windowMs: 15 * 60 * 1000, max: 20 });
    if (!invoiceRate.success) {
      return NextResponse.json(
        { error: `Too many payment attempts for this invoice. Please try again in ${invoiceRate.retryAfterSeconds} seconds.` },
        { status: 429, headers: { 'Retry-After': String(invoiceRate.retryAfterSeconds) } }
      );
    }

    // 1. Fetch the invoice
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Determine if updating status directly or recording offline payment
    const isOffline = action === 'offlinePayment' || action === 'updateStatus' || Boolean(
      paymentMethod && (paymentMethod.includes('Offline') || OFFLINE_METHODS.includes(paymentMethod))
    );
    const methodUsed = paymentMethod || (isOffline ? 'Bank Transfer (Offline)' : 'Paystack / Online Gateway');
    const finalRef = reference.trim().slice(0, 200);
    let targetStatus = 'Paid';

    if (isOffline) {
      // Offline payments and manual status reconciliation
      const authUser = await getAuthUser();
      if (authUser && !canModifyWorkspaceInvoice(authUser, invoice.workspaceId)) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permissions to modify invoices for this workspace.' },
          { status: 403 }
        );
      }
      // Public customers can NEVER self-settle: they only move the invoice to 'Pending Verification'.
      const decision = resolveOfflineDecision({
        isAuthenticated: Boolean(authUser),
        action,
        requestedStatus: newStatus,
        currentStatus: invoice.status,
      });
      if (!decision.ok) {
        return NextResponse.json({ error: decision.error }, { status: decision.status });
      }
      targetStatus = decision.targetStatus;
    } else {
      if (invoice.status === 'Paid') {
        return NextResponse.json({ success: true, message: 'Already marked as paid', status: 'Paid' });
      }

      // Online payment MUST supply a valid transaction reference
      if (!finalRef) {
        return NextResponse.json({ error: 'Missing transaction reference for online payment verification' }, { status: 400 });
      }

      // Reject reuse of a gateway reference already consumed by another invoice
      const { data: existingRef } = await supabase
        .from('invoices')
        .select('id')
        .eq('paymentReference', finalRef)
        .neq('id', invoiceId)
        .maybeSingle();
      if (existingRef) {
        return NextResponse.json(
          { error: 'This payment reference has already been used. Reused references are rejected.' },
          { status: 409 }
        );
      }

      const devBypass = simulatedPaymentsAllowed();

      if (isSimulatedReference(finalRef)) {
        // Server-owned gate: requires non-production NODE_ENV AND ALLOW_SIMULATED_PAYMENTS=true
        if (!devBypass) {
          return NextResponse.json({ error: 'Simulated payment references are not accepted.' }, { status: 400 });
        }
      } else {
        // Fetch the farm's secret key or fallback to platform key
        const { data: systemSettings } = await supabase
          .from('systemSettings')
          .select('paystackSecretKey')
          .eq('workspaceId', invoice.workspaceId)
          .limit(1)
          .maybeSingle();

        const gwConfig = await getGatewaysConfig();
        const secretKey = systemSettings?.paystackSecretKey || gwConfig.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;

        if (!secretKey || secretKey.includes('placeholder')) {
          if (!devBypass) {
            return NextResponse.json({ error: 'Payment gateway configuration is missing or inactive for this farm.' }, { status: 500 });
          }
        } else {
          let verifyData: PaystackVerifyPayload | null = null;
          try {
            const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(finalRef)}`, {
              headers: { Authorization: `Bearer ${secretKey}` },
              cache: 'no-store',
            });
            verifyData = (await verifyRes.json()) as PaystackVerifyPayload;
          } catch (_err) {
            return NextResponse.json({ error: 'Failed to communicate with payment gateway' }, { status: 502 });
          }
          const check = validatePaystackVerification(verifyData, {
            reference: finalRef,
            invoiceId: String(invoice.id),
            totalAmount: Number(invoice.totalAmount || 0),
          });
          if (!check.ok) {
            return NextResponse.json({ error: check.error }, { status: 400 });
          }
        }
      }
    }

    if (invoice.status === 'Paid' && targetStatus === 'Paid') {
      return NextResponse.json({ success: true, message: 'Already marked as paid', status: 'Paid' });
    }

    // 5. Update invoice status and store paymentReference (UNIQUE index enforces single use)
    const storedRef = storedReferenceFor(isOffline, String(invoice.id), finalRef);
    const targetSaleId = invoice.saleId || ('sa' + Date.now().toString().slice(-8));
    const updatePayload: Record<string, unknown> = { status: targetStatus };
    if (storedRef) {
      updatePayload.paymentReference = storedRef;
    }
    if (!invoice.saleId) {
      updatePayload.saleId = targetSaleId;
    }
    let updateError: unknown = null;
    try {
      const res = await supabase.from('invoices').update(updatePayload).eq('id', invoiceId);
      updateError = res?.error ?? null;
    } catch (err) {
      updateError = err;
    }
    if (updateError) {
      if (isDuplicateKeyError(updateError)) {
        return NextResponse.json(
          { error: 'This payment reference has already been used. Reused references are rejected.' },
          { status: 409 }
        );
      }
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }

    // Defence in depth for databases that predate the UNIQUE index: detect a concurrent winner.
    if (storedRef && !isOffline) {
      const { data: refOwners } = await supabase.from('invoices').select('id').eq('paymentReference', storedRef);
      if (Array.isArray(refOwners) && refOwners.length > 1) {
        await supabase
          .from('invoices')
          .update({ status: invoice.status || 'Unpaid', paymentReference: invoice.paymentReference ?? null })
          .eq('id', invoiceId);
        return NextResponse.json(
          { error: 'This payment reference has already been used. Reused references are rejected.' },
          { status: 409 }
        );
      }
    }

    // 6. If Paid, ensure completed sale record exists in sales table
    if (targetStatus === 'Paid') {
      const { data: existingSales } = await supabase.from('sales').select('id').eq('id', targetSaleId).eq('workspaceId', invoice.workspaceId);

      if (!existingSales || existingSales.length === 0) {
        await supabase.from('sales').insert([{
          id: targetSaleId,
          workspaceId: invoice.workspaceId,
          date: invoice.date || new Date().toISOString().split('T')[0],
          type: (invoice.items || '').toLowerCase().includes('chicken') ? 'Chickens' : 'Eggs',
          quantity: Number(invoice.quantity) || 1,
          totalAmount: Number(invoice.totalAmount) || 0,
          customerName: invoice.customerName || 'Invoice Customer',
          paymentMethod: methodUsed,
          status: 'Paid'
        }]);
      } else {
        await supabase.from('sales').update({ status: 'Paid', paymentMethod: methodUsed }).eq('id', targetSaleId).eq('workspaceId', invoice.workspaceId);
      }

      // 7. Log settlement alert
      await supabase.from('alertLogs').insert([{
        id: 'al' + Date.now().toString().slice(-8),
        workspaceId: invoice.workspaceId,
        date: invoice.date || new Date().toISOString().split('T')[0],
        message: `INVOICE SETTLEMENT (${methodUsed}): Customer ${invoice.customerName} settled ₦${Number(invoice.totalAmount || 0).toLocaleString()} for Invoice #${invoice.id} (Ref: ${finalRef || 'Direct'}). Added to Completed Sales.`,
        severity: 'Info',
        read: false
      }]);
    } else if (targetStatus === 'Pending Verification') {
      // Log notification for farm administration to verify bank transfer
      await supabase.from('alertLogs').insert([{
        id: 'al' + Date.now().toString().slice(-8),
        workspaceId: invoice.workspaceId,
        date: invoice.date || new Date().toISOString().split('T')[0],
        message: `OFFLINE PAYMENT PENDING VERIFICATION: Customer ${invoice.customerName} submitted offline transfer details (${methodUsed}, Ref: ${finalRef || 'Direct'}) for Invoice #${invoice.id}. Awaiting staff confirmation.`,
        severity: 'Warning',
        read: false
      }]);
    }

    const resMessage = targetStatus === 'Paid'
      ? 'Payment verified and recorded successfully.'
      : targetStatus === 'Pending Verification'
        ? 'Payment details submitted. Awaiting verification by farm management.'
        : `Invoice status updated to ${targetStatus}.`;

    return NextResponse.json({ success: true, status: targetStatus, paymentMethod: methodUsed, message: resMessage });
  } catch (_error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
