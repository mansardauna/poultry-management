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
    
    if (body.action === 'createInvoice') {
      const invId = 'inv' + Date.now().toString().slice(-8);
      const saleId = 'sa' + Date.now().toString().slice(-8);
      const date = body.date || new Date().toISOString().split('T')[0];
      const quantity = Number(body.quantity) || 1;
      const unitPrice = Number(body.unitPrice) || 0;
      const totalAmount = Number(body.totalAmount) || (quantity * unitPrice);

      const newInvoice = {
        id: invId,
        workspaceId,
        date,
        saleId,
        customerName: body.customerName || 'Customer Invoice',
        items: body.items || 'Poultry Products Invoice',
        quantity,
        unitPrice,
        totalAmount,
        status: body.status || 'Unpaid'
      };

      const { data, error } = await supabase.from('invoices').insert([newInvoice]).select();
      if (error) {
        console.error("Create Invoice Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ invoice: data?.[0] || newInvoice }, { status: 201 });
    }

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

    if (body.action === 'updateInvoiceStatus' || body.type === 'invoice') {
      const { id, status } = body;
      if (!id || !status) return NextResponse.json({ error: 'Invoice ID and status required' }, { status: 400 });

      await supabase.from('invoices').update({ status }).eq('id', id).eq('workspaceId', workspaceId);

      if (status === 'Paid') {
        const { data: invData } = await supabase.from('invoices').select('*').eq('id', id).eq('workspaceId', workspaceId).limit(1).maybeSingle();
        if (invData) {
          const targetSaleId = invData.saleId || ('sa' + Date.now().toString().slice(-8));
          const { data: existingSale } = await supabase.from('sales').select('id').eq('id', targetSaleId).eq('workspaceId', workspaceId).limit(1).maybeSingle();
          
          if (!existingSale) {
            await supabase.from('sales').insert([{
              id: targetSaleId,
              workspaceId,
              date: invData.date || new Date().toISOString().split('T')[0],
              type: (invData.items || '').toLowerCase().includes('chicken') ? 'Chickens' : 'Eggs',
              quantity: invData.quantity || 1,
              totalAmount: invData.totalAmount || 0,
              customerName: invData.customerName || 'Customer Invoice',
              paymentMethod: 'Paystack / Online Gateway',
              status: 'Paid'
            }]);
          } else {
            await supabase.from('sales').update({ status: 'Paid' }).eq('id', targetSaleId).eq('workspaceId', workspaceId);
          }

          // Log alert
          await supabase.from('alertLogs').insert([{
            id: 'al' + Date.now().toString().slice(-8),
            workspaceId,
            date: invData.date || new Date().toISOString().split('T')[0],
            message: `INVOICE SETTLED: Invoice #${invData.id} for ${invData.customerName} (₦${Number(invData.totalAmount).toLocaleString()}) marked as Paid and added to Completed Sales.`,
            severity: 'Info',
            read: false
          }]);
        }
      }

      return NextResponse.json({ success: true });
    }

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
    const type = searchParams.get('type');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (type === 'invoice' || id.startsWith('inv')) {
      const { error: invErr } = await supabase.from('invoices').delete().eq('id', id).eq('workspaceId', workspaceId);
      if (invErr) {
        console.error("Delete Invoice Error:", invErr);
        return NextResponse.json({ error: invErr.message }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Invoice deleted' });
    }

    // Delete sale and associated invoice if exists
    await Promise.all([
      supabase.from('sales').delete().eq('id', id).eq('workspaceId', workspaceId),
      supabase.from('invoices').delete().eq('saleId', id).eq('workspaceId', workspaceId)
    ]);

    return NextResponse.json({ success: true, message: 'Sale deleted' });
  } catch (err: any) {
    console.error("DELETE Sales API Error:", err);
    return NextResponse.json({ error: err?.message || 'Failed to delete record' }, { status: 500 });
  }
}
