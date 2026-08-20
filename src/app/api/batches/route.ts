'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const { data: batchesData } = await supabase.from('batches').select('*').eq('workspaceId', workspaceId);
  return NextResponse.json(batchesData || []);
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'mortality') {
      const { data: batchesData } = await supabase.from('batches').select('*').eq('id', body.batchId).limit(1);
      const batch = batchesData?.[0];
      if (batch) {
        const count = Number(body.mortalityCount) || 1;
        const newMortalityCount = batch.mortalityCount + count;
        const newQuantity = Math.max(0, batch.quantity - count);
        
        await supabase.from('batches')
          .update({ mortalityCount: newMortalityCount, quantity: newQuantity })
          .eq('id', batch.id);
          
        await supabase.from('alertLogs').insert([{
          id: 'al' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `MORTALITY ALERT: Batch ${batch.id} (${batch.breed}) lost ${count} bird(s). Reason: ${body.reason || 'Not specified'}.`,
          severity: 'Warning'
        }]);

        await supabase.from('mortalityLogs').insert([{
          id: `MORT-${Date.now()}`,
          workspaceId,
          date: body.date || new Date().toISOString().split('T')[0],
          batchId: batch.id,
          count: count,
          cause: body.reason || 'Unknown'
        }]);
        
        return NextResponse.json({ success: true, batch: { ...batch, mortalityCount: newMortalityCount, quantity: newQuantity } });
      }
      return NextResponse.json({ error: 'Batch not found' }, { status: 440 });
    }

    if (body.action === 'vaccination') {
      const { data: batchesData } = await supabase.from('batches').select('*').eq('id', body.batchId).limit(1);
      const batch = batchesData?.[0];
      if (batch) {
        await supabase.from('batches')
          .update({ vaccinationStatus: 'Up to Date' })
          .eq('id', batch.id);
          
        await supabase.from('tasks').insert([{
          id: 't' + Date.now(),
          workspaceId,
          assignedTo: 'Jane Smith',
          taskName: `Vaccine Booster: Batch ${batch.id} (${body.vaccineName})`,
          status: 'Pending',
          date: body.nextBoosterDate || new Date().toISOString().split('T')[0]
        }]);
        
        return NextResponse.json({ success: true, batch: { ...batch, vaccinationStatus: 'Up to Date' } });
      }
      return NextResponse.json({ error: 'Batch not found' }, { status: 440 });
    }

    if (body.action === 'transfer') {
      const { data: batchesData } = await supabase.from('batches').select('*').eq('id', body.batchId).limit(1);
      const batch = batchesData?.[0];
      if (batch) {
        const oldSection = batch.farmSection;
        const targetSection = body.targetSection;
        
        await supabase.from('batches')
          .update({ farmSection: targetSection })
          .eq('id', batch.id);

        await supabase.from('alertLogs').insert([{
          id: 'al' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `BIRD TRANSFER: Moved ${body.transferCount || batch.quantity} birds in Batch ${batch.id} from ${oldSection} to ${targetSection}`,
          severity: 'Info'
        }]);
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
    
    await supabase.from('batches').insert([newBatch]);
    
    await supabase.from('alertLogs').insert([{
      id: 'al' + Date.now(),
      workspaceId,
      date: new Date().toISOString().split('T')[0],
      message: `NEW BATCH ADDED: Batch ${newBatch.id} - ${newBatch.quantity} ${newBatch.breed} (${newBatch.type}) initialized in ${newBatch.farmSection}.`,
      severity: 'Info'
    }]);
    
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

    await supabase.from('batches')
      .update(updateData)
      .eq('id', id).eq('workspaceId', workspaceId);

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

    await supabase.from('batches').delete().eq('id', id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete batch' }, { status: 500 });
  }
}
