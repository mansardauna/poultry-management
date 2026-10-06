'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { invoiceId, reference, action, paymentMethod, newStatus } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
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
    const isOffline = action === 'offlinePayment' || Boolean(
      (paymentMethod && paymentMethod.includes('Offline')) || 
      paymentMethod === 'Bank Transfer' || 
      paymentMethod === 'Cash' || 
      paymentMethod === 'POS'
    );
    const targetStatus = newStatus || 'Paid';
    const methodUsed = paymentMethod || (isOffline ? 'Bank Transfer (Offline)' : 'Paystack / Online Gateway');
    const finalRef = (reference || '').trim();

    if (invoice.status === 'Paid' && targetStatus === 'Paid') {
      return NextResponse.json({ success: true, message: 'Already marked as paid', status: 'Paid' });
    }

    let isVerified = false;
    interface PaystackVerifyRes { status?: boolean; data?: { status?: string }; }
    let verifyData: PaystackVerifyRes | null = null;

    // Check for payment reference replay if a reference was supplied
    if (finalRef) {
      const { data: existingRef } = await supabase
        .from('invoices')
        .select('id, customerName, totalAmount')
        .eq('paymentReference', finalRef)
        .neq('id', invoiceId)
        .maybeSingle();

      if (existingRef) {
        return NextResponse.json(
          { error: `Payment reference '${finalRef}' has already been consumed by another invoice (#${existingRef.id}). Reused references are rejected.` },
          { status: 409 }
        );
      }
    }

    if (isOffline) {
      // Offline payments and manual status reconciliation REQUIRE authenticated staff or admin
      const authUser = await getAuthUser();
      if (!authUser) {
        return NextResponse.json(
          { error: 'Unauthorized: Offline payment recording and manual status updates require staff or admin authentication.' },
          { status: 401 }
        );
      }

      // Verify the authenticated user has access to this invoice's workspace
      const isSuper = authUser.role === 'SuperAdmin';
      const userWs = authUser.workspaceId?.replace(/"/g, '').trim();
      const invWs = (invoice.workspaceId || '').replace(/"/g, '').trim();

      if (!isSuper && userWs && invWs && userWs !== invWs && !userWs.includes(invWs) && !invWs.includes(userWs)) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permissions to modify invoices for this workspace.' },
          { status: 403 }
        );
      }

      isVerified = true;
    } else {
      // Online payment MUST supply a valid transaction reference
      if (!finalRef) {
        return NextResponse.json({ error: 'Missing transaction reference for online payment verification' }, { status: 400 });
      }

      // Fetch the farm's secret key or fallback to platform key
      const { data: systemSettings } = await supabase
        .from('systemSettings')
        .select('paystackSecretKey')
        .eq('workspaceId', invoice.workspaceId)
        .limit(1)
        .maybeSingle();

      const secretKey = systemSettings?.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY;

      if (!secretKey || secretKey.includes('placeholder')) {
        return NextResponse.json({ error: 'Payment gateway configuration is missing or inactive for this farm.' }, { status: 500 });
      }

      try {
        const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(finalRef)}`, {
          headers: { Authorization: `Bearer ${secretKey}` }
        });
        verifyData = (await verifyRes.json()) as PaystackVerifyRes;
        if (verifyData?.status === true && verifyData?.data?.status === 'success') {
          isVerified = true;
        }
      } catch (_err) {
        return NextResponse.json({ error: 'Failed to communicate with payment gateway' }, { status: 502 });
      }
    }

    if (!isVerified) {
      return NextResponse.json({ error: 'Payment verification failed with gateway. Transaction was not confirmed.' }, { status: 400 });
    }

    // 4. Verify total amount paid matches invoice amount if gateway returned payload
    const verifyObj = verifyData?.data as { amount?: number } | undefined;
    if (verifyObj?.amount && verifyObj.amount < invoice.totalAmount * 100) {
      return NextResponse.json({ error: 'Insufficient payment amount detected' }, { status: 400 });
    }

    // 5. Update invoice status and store paymentReference
    const updatePayload: Record<string, unknown> = { status: targetStatus };
    if (finalRef) {
      updatePayload.paymentReference = finalRef;
    }
    await supabase
      .from('invoices')
      .update(updatePayload)
      .eq('id', invoiceId);
      
    // 6. Ensure completed sale record exists in sales table if paid
    if (targetStatus === 'Paid') {
      const targetSaleId = invoice.saleId || ('sa' + Date.now().toString().slice(-8));
      const { data: existingSales } = await supabase.from('sales').select('id').eq('id', targetSaleId).eq('workspaceId', invoice.workspaceId);

      if (!existingSales || existingSales.length === 0) {
        await supabase.from('sales').insert([{
          id: targetSaleId,
          workspaceId: invoice.workspaceId,
          date: invoice.date || new Date().toISOString().split('T')[0],
          type: (invoice.items || '').toLowerCase().includes('chicken') ? 'Chickens' : 'Eggs',
          quantity: invoice.quantity || 1,
          totalAmount: invoice.totalAmount || 0,
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
        message: `INVOICE SETTLEMENT (${methodUsed}): Customer ${invoice.customerName} settled ₦${Number(invoice.totalAmount).toLocaleString()} for Invoice #${invoice.id} (Ref: ${finalRef}). Added to Completed Sales.`,
        severity: 'Info',
        read: false
      }]);
    }

    return NextResponse.json({ success: true, status: targetStatus, paymentMethod: methodUsed });
  } catch (_error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
