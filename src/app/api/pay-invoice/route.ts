'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { invoiceId, reference } = await request.json();

    if (!invoiceId || !reference) {
      return NextResponse.json({ error: 'Missing invoiceId or reference' }, { status: 400 });
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

    if (invoice.status === 'Paid') {
      return NextResponse.json({ success: true, message: 'Already paid' });
    }

    // 2. Fetch the farm's secret key
    const { data: systemSettings } = await supabase
      .from('systemSettings')
      .select('paystackSecretKey')
      .eq('workspaceId', invoice.workspaceId)
      .limit(1)
      .maybeSingle();

    const secretKey = systemSettings?.paystackSecretKey;

    if (!secretKey) {
      return NextResponse.json({ 
        error: 'Payment gateway secret key is not configured by farm admin in Settings.' 
      }, { status: 400 });
    }

    // 3. Verify the transaction with Paystack API
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${secretKey}`
      }
    });
    const verifyData = await verifyRes.json();

    if (!verifyData.status || verifyData.data?.status !== 'success') {
      return NextResponse.json({ error: 'Official payment verification failed with gateway.' }, { status: 400 });
    }

    // 4. Verify total amount paid matches invoice amount
    if (verifyData.data.amount < invoice.totalAmount * 100) {
      return NextResponse.json({ error: 'Insufficient payment amount detected' }, { status: 400 });
    }

    // 5. Mark invoice as paid
    await supabase
      .from('invoices')
      .update({ status: 'Paid' })
      .eq('id', invoiceId);
      
    // 6. Ensure completed sale record exists in sales table
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
        paymentMethod: 'Paystack / Online Gateway',
        status: 'Paid'
      }]);
    } else {
      await supabase.from('sales').update({ status: 'Paid' }).eq('id', targetSaleId).eq('workspaceId', invoice.workspaceId);
    }

    // 7. Log settlement alert
    await supabase.from('alertLogs').insert([{
      id: 'al' + Date.now().toString().slice(-8),
      workspaceId: invoice.workspaceId,
      date: invoice.date || new Date().toISOString().split('T')[0],
      message: `AUTOMATIC SETTLEMENT: Customer ${invoice.customerName} paid ₦${Number(invoice.totalAmount).toLocaleString()} for Invoice #${invoice.id}. Added to Completed Sales.`,
      severity: 'Info',
      read: false
    }]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Paystack verify error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
