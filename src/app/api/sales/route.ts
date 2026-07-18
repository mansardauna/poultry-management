'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [salesRes, invoicesRes, batchesRes] = await Promise.all([
    supabase.from('sales').select('*').eq('workspaceId', workspaceId),
    supabase.from('invoices').select('*').eq('workspaceId', workspaceId),
    supabase.from('batches').select('*').eq('workspaceId', workspaceId)
  ]);
  
  return NextResponse.json({
    sales: salesRes.data || [],
    invoices: invoicesRes.data || [],
    batches: batchesRes.data || []
  });
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    const newSaleId = 'sa' + Date.now().toString().slice(-8);
    const date = body.date || new Date().toISOString().split('T')[0];
    
    const newSale = {
      id: newSaleId,
      workspaceId,
      date,
      type: body.type || 'Eggs',
      quantity: Number(body.quantity),
      totalAmount: Number(body.totalAmount),
      customerName: body.customerName || 'Walk-in Customer',
      paymentMethod: body.paymentMethod || 'Cash',
      status: body.status || 'Paid'
    };
    
    await supabase.from('sales').insert([newSale]);
      
    if (newSale.type === 'Chickens') {
      const batchId = body.batchId || 'b3'; // Default to broilers b3
      const { data: batches } = await supabase.from('batches').select('*').eq('id', batchId).eq('workspaceId', workspaceId);
      const batch = batches?.[0];
      if (batch) {
        const qtyToSubtract = Math.min(batch.quantity, newSale.quantity);
        await supabase.from('batches')
          .update({ quantity: batch.quantity - qtyToSubtract })
          .eq('id', batchId).eq('workspaceId', workspaceId);
        
        await supabase.from('alertLogs').insert([{
          id: 'al' + Date.now().toString().slice(-8),
          workspaceId,
          date,
          message: `STOCK DEDUCTION: Sold ${qtyToSubtract} birds from Batch ${batch.id} (${batch.breed}). New flock size: ${batch.quantity - qtyToSubtract} birds.`,
          severity: 'Info',
          read: false
        }]);
      }
    } else if (newSale.type === 'Eggs') {
      await supabase.from('alertLogs').insert([{
        id: 'al' + Date.now().toString().slice(-8),
        workspaceId,
        date,
        message: `SALES OUTFLOW: Transferred ${newSale.quantity} eggs to ${newSale.customerName} for ₦${newSale.totalAmount.toLocaleString()}`,
        severity: 'Info',
        read: false
      }]);
    }

    const newInvoice = {
      id: 'inv' + Date.now().toString().slice(-8),
      workspaceId,
      date: newSale.date,
      saleId: newSaleId,
      customerName: newSale.customerName,
      items: `${newSale.type} Crate / Batch Sale`,
      quantity: newSale.quantity,
      unitPrice: Math.round(newSale.totalAmount / newSale.quantity),
      totalAmount: newSale.totalAmount,
      status: newSale.status === 'Paid' ? 'Paid' : 'Pending'
    };
    
    await supabase.from('invoices').insert([newInvoice]);

    // Re-construct exactly as intended for response
    const invoiceRecord = {
        id: newInvoice.id,
        date: newSale.date,
        saleId: newSaleId,
        customerName: newSale.customerName,
        items: `${newSale.type} Crate / Batch Sale`,
        quantity: newSale.quantity,
        unitPrice: Math.round(newSale.totalAmount / newSale.quantity),
        totalAmount: newSale.totalAmount,
        status: newSale.status === 'Paid' ? 'Paid' : 'Pending'
    };

    return NextResponse.json({ sale: newSale, invoice: invoiceRecord }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 });
  }
}

/** Exported function PUT */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await supabase.from('sales').update(fields).eq('id', id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await supabase.from('sales').delete().eq('id', id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
