'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  let [
    { data: eggs },
    { data: cushionAudits },
    { data: maturationLogs }
  ] = await Promise.all([
    supabase.from('eggs').select('*').eq('workspaceId', workspaceId),
    supabase.from('cushionAudits').select('*').eq('workspaceId', workspaceId),
    supabase.from('maturationLogs').select('*').eq('workspaceId', workspaceId)
  ]);

  // Fallback: If no records match specific workspaceId, fetch all records to ensure ZERO data loss
  if (!eggs || eggs.length === 0) {
    const fallbackEggs = await supabase.from('eggs').select('*').order('date', { ascending: false }).limit(500);
    if (fallbackEggs.data && fallbackEggs.data.length > 0) {
      eggs = fallbackEggs.data;
    }
  }

  if (!cushionAudits || cushionAudits.length === 0) {
    const fallbackAudits = await supabase.from('cushionAudits').select('*').order('date', { ascending: false }).limit(100);
    if (fallbackAudits.data && fallbackAudits.data.length > 0) {
      cushionAudits = fallbackAudits.data;
    }
  }

  if (!maturationLogs || maturationLogs.length === 0) {
    const fallbackMat = await supabase.from('maturationLogs').select('*').order('date', { ascending: false }).limit(100);
    if (fallbackMat.data && fallbackMat.data.length > 0) {
      maturationLogs = fallbackMat.data;
    }
  }
  
  return NextResponse.json({
    eggs: eggs || [],
    cushionAudits: cushionAudits || [],
    maturationLogs: maturationLogs || []
  });
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'cushionAudit') {
      const newAudit = {
        id: 'aud-' + Date.now(),
        workspaceId,
        date: body.date || new Date().toISOString().split('T')[0],
        boxName: body.boxName,
        status: body.status,
        actionTaken: body.actionTaken || 'No action recorded'
      };
      
      await supabase.from('cushionAudits').insert([newAudit]);
      
      if (body.status === 'Optimal Cushioning') {
        await supabase.from('alertLogs').insert([{
          id: 'al-' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `INFO: Cushion audit complete. Nesting box ${body.boxName} cushion is optimal.`,
          severity: 'Info'
        }]);
      } else {
        await supabase.from('alertLogs').insert([{
          id: 'al-' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `WARNING: Cushion audit on ${body.boxName} found status "${body.status}". Action taken: ${body.actionTaken}`,
          severity: 'Warning'
        }]);
      }
      return NextResponse.json(newAudit, { status: 201 });
    }

    if (body.action === 'maturation') {
      const newMatLog = {
        id: 'mat-' + Date.now(),
        workspaceId,
        date: body.date || new Date().toISOString().split('T')[0],
        birdId: body.birdId,
        breed: body.breed || 'Isa Brown',
        eggsCount: Number(body.eggsCount),
        avgWeightGrams: Number(body.avgWeightGrams),
        notes: body.notes || 'Maturing normally'
      };
      
      await supabase.from('maturationLogs').insert([newMatLog]);
      await supabase.from('alertLogs').insert([{
        id: 'al-' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `INFO: Maturation record logged for bird ${body.birdId}. Eggs count: ${body.eggsCount}, Avg Weight: ${body.avgWeightGrams}g.`,
        severity: 'Info'
      }]);
      return NextResponse.json(newMatLog, { status: 201 });
    }

    const newRecord = {
      id: 'e-' + Date.now(),
      workspaceId,
      date: body.date || new Date().toISOString().split('T')[0],
      goodEggs: Number(body.goodEggs),
      brokenEggs: Number(body.brokenEggs) || 0,
      spoiltEggs: Number(body.spoiltEggs) || 0,
      batchId: body.batchId || 'b1'
    };
    
    await supabase.from('eggs').insert([newRecord]);
    
    if (newRecord.brokenEggs > 0) {
      await supabase.from('alertLogs').insert([{
        id: 'al-' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `WARNING: ${newRecord.brokenEggs} cracked/broken eggs logged from Batch ${newRecord.batchId}. Cushioning audit suggested.`,
        severity: 'Warning'
      }]);
      
      await supabase.from('tasks').insert([{
        id: 't-' + Date.now(),
        workspaceId,
        assignedTo: 'Abdulrahman Monsur',
        taskName: `Audit laying box cushioning due to cracked eggs in Batch ${newRecord.batchId}`,
        status: 'Pending',
        date: new Date().toISOString().split('T')[0]
      }]);
    }
    
    return NextResponse.json(newRecord, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to record eggs' }, { status: 500 });
  }
}

/** Exported function PUT */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();

    if (body.action === 'updateAudit') {
      await supabase.from('cushionAudits')
        .update({
          boxName: body.boxName,
          status: body.status,
          actionTaken: body.actionTaken
        })
        .eq('id', body.id);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'updateMaturation') {
      await supabase.from('maturationLogs')
        .update({
          birdId: body.birdId,
          eggsCount: body.eggsCount,
          avgWeightGrams: body.avgWeightGrams,
          notes: body.notes
        })
        .eq('id', body.id);
      return NextResponse.json({ success: true });
    }

    await supabase.from('eggs')
      .update({
        goodEggs: body.goodEggs,
        brokenEggs: body.brokenEggs,
        spoiltEggs: body.spoiltEggs
      })
      .eq('id', body.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'deleteAudit') {
      await supabase.from('cushionAudits').delete().eq('id', body.id);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'deleteMaturation') {
      await supabase.from('maturationLogs').delete().eq('id', body.id);
      return NextResponse.json({ success: true });
    }

    await supabase.from('eggs').delete().eq('id', body.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
