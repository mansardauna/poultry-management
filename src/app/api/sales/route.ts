import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

export async function GET() {
  const workspaceId = await getWorkspaceId();
  const sales = await db.select().from(schema.sales).where(eq(schema.sales.workspaceId, workspaceId));
  const invoices = await db.select().from(schema.invoices).where(eq(schema.invoices.workspaceId, workspaceId));
  const batches = await db.select().from(schema.batches).where(eq(schema.batches.workspaceId, workspaceId));
  
  return NextResponse.json({
    sales,
    invoices,
    batches
  });
}

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
    
    await db.transaction(async (tx) => {
      await tx.insert(schema.sales).values(newSale);
      
      if (newSale.type === 'Chickens') {
        const batchId = body.batchId || 'b3'; // Default to broilers b3
        const [batch] = await tx.select().from(schema.batches).where(and(eq(schema.batches.id, batchId), eq(schema.batches.workspaceId, workspaceId)));
        if (batch) {
          const qtyToSubtract = Math.min(batch.quantity, newSale.quantity);
          await tx.update(schema.batches)
            .set({ quantity: batch.quantity - qtyToSubtract })
            .where(and(eq(schema.batches.id, batchId), eq(schema.batches.workspaceId, workspaceId)));
          
          await tx.insert(schema.alertLogs).values({
            id: 'al' + Date.now().toString().slice(-8),
            workspaceId,
            date,
            message: `STOCK DEDUCTION: Sold ${qtyToSubtract} birds from Batch ${batch.id} (${batch.breed}). New flock size: ${batch.quantity - qtyToSubtract} birds.`,
            severity: 'Info',
            read: false
          });
        }
      } else if (newSale.type === 'Eggs') {
        await tx.insert(schema.alertLogs).values({
          id: 'al' + Date.now().toString().slice(-8),
          workspaceId,
          date,
          message: `SALES OUTFLOW: Transferred ${newSale.quantity} eggs to ${newSale.customerName} for ₦${newSale.totalAmount.toLocaleString()}`,
          severity: 'Info',
          read: false
        });
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
      
      await tx.insert(schema.invoices).values(newInvoice);
    });

    // Re-construct exactly as intended for response
    const invoiceRecord = {
        id: 'inv' + Date.now().toString().slice(-8),
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
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.update(schema.sales).set(fields).where(and(eq(schema.sales.id, id), eq(schema.sales.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(schema.sales).where(and(eq(schema.sales.id, id), eq(schema.sales.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete sale' }, { status: 500 });
  }
}
