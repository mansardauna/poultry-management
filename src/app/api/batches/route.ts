'use strict';
import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const batchesData = await db.select().from(schema.batches).where(eq(schema.batches.workspaceId, workspaceId));
  return NextResponse.json(batchesData);
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'mortality') {
      const batchesData = await db.select().from(schema.batches).where(and(eq(schema.batches.id, body.batchId), eq(schema.batches.workspaceId, workspaceId))).limit(1);
      const batch = batchesData[0];
      if (batch) {
        const count = Number(body.mortalityCount) || 1;
        const newMortalityCount = batch.mortalityCount + count;
        const newQuantity = Math.max(0, batch.quantity - count);
        
        await db.transaction(async (tx) => {
          await tx.update(schema.batches)
            .set({ mortalityCount: newMortalityCount, quantity: newQuantity })
            .where(eq(schema.batches.id, batch.id));
            
          await tx.insert(schema.alertLogs).values({
            id: 'al' + Date.now(),
            workspaceId,
            date: new Date().toISOString().split('T')[0],
            message: `MORTALITY ALERT: Batch ${batch.id} (${batch.breed}) lost ${count} bird(s). Reason: ${body.reason || 'Not specified'}.`,
            severity: 'Warning'
          });

          await tx.insert(schema.mortalityLogs).values({
            id: `MORT-${Date.now()}`,
            workspaceId,
            date: new Date().toISOString().split('T')[0],
            batchId: batch.id,
            count: count,
            cause: body.reason || 'Unknown'
          });
        });
        
        return NextResponse.json({ success: true, batch: { ...batch, mortalityCount: newMortalityCount, quantity: newQuantity } });
      }
      return NextResponse.json({ error: 'Batch not found' }, { status: 440 });
    }

    if (body.action === 'vaccination') {
      const batchesData = await db.select().from(schema.batches).where(and(eq(schema.batches.id, body.batchId), eq(schema.batches.workspaceId, workspaceId))).limit(1);
      const batch = batchesData[0];
      if (batch) {
        await db.transaction(async (tx) => {
          await tx.update(schema.batches)
            .set({ vaccinationStatus: 'Up to Date' })
            .where(eq(schema.batches.id, batch.id));
            
          await tx.insert(schema.tasks).values({
            id: 't' + Date.now(),
            workspaceId,
            assignedTo: 'Jane Smith',
            taskName: `Vaccine Booster: Batch ${batch.id} (${body.vaccineName})`,
            status: 'Pending',
            date: body.nextBoosterDate || new Date().toISOString().split('T')[0]
          });
        });
        
        return NextResponse.json({ success: true, batch: { ...batch, vaccinationStatus: 'Up to Date' } });
      }
      return NextResponse.json({ error: 'Batch not found' }, { status: 440 });
    }

    if (body.action === 'transfer') {
      const batchesData = await db.select().from(schema.batches).where(and(eq(schema.batches.id, body.batchId), eq(schema.batches.workspaceId, workspaceId))).limit(1);
      const batch = batchesData[0];
      if (batch) {
        const oldSection = batch.farmSection;
        const targetSection = body.targetSection;
        
        await db.transaction(async (tx) => {
          await tx.update(schema.batches)
            .set({ farmSection: targetSection })
            .where(eq(schema.batches.id, batch.id));

          await tx.insert(schema.alertLogs).values({
            id: 'al' + Date.now(),
            workspaceId,
            date: new Date().toISOString().split('T')[0],
            message: `BIRD TRANSFER: Moved ${body.transferCount || batch.quantity} birds in Batch ${batch.id} from ${oldSection} to ${targetSection}`,
            severity: 'Info'
          });
        });
        return NextResponse.json({ success: true, batch: { ...batch, farmSection: targetSection } });
      }
      return NextResponse.json({ error: 'Batch not found' }, { status: 440 });
    }

    const newBatch = {
      id: 'b' + Date.now(),
      workspaceId,
      breed: body.breed,
      quantity: Number(body.quantity),
      purchaseDate: body.purchaseDate || new Date().toISOString().split('T')[0],
      ageInWeeks: Number(body.ageInWeeks) || 1,
      mortalityCount: 0,
      vaccinationStatus: body.vaccinationStatus || 'Pending',
      farmSection: body.farmSection || 'Unassigned',
      type: body.type || 'Layers'
    };
    
    await db.transaction(async (tx) => {
      await tx.insert(schema.batches).values(newBatch);
      
      await tx.insert(schema.alertLogs).values({
        id: 'al' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `NEW BATCH ADDED: Batch ${newBatch.id} - ${newBatch.quantity} ${newBatch.breed} (${newBatch.type}) initialized in ${newBatch.farmSection}.`,
        severity: 'Info'
      });
    });
    
    return NextResponse.json(newBatch, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to manage batch operations' }, { status: 500 });
  }
}

/** Exported function PUT */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...updateData } = body;
    if (!id) return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });

    await db.update(schema.batches)
      .set(updateData)
      .where(and(eq(schema.batches.id, id), eq(schema.batches.workspaceId, workspaceId)));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update batch' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Batch ID is required' }, { status: 400 });

    await db.delete(schema.batches).where(and(eq(schema.batches.id, id), eq(schema.batches.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}
