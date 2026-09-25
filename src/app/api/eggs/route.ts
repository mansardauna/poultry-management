'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [
    { data: eggs },
    { data: cushionAudits },
    { data: maturationLogs }
  ] = await Promise.all([
    applyWorkspaceFilter(supabase.from('eggs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('cushionAudits').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('maturationLogs').select('*'), workspaceId)
  ]);
  
  const normalizedEggs = (eggs || []).map((e: any) => ({
    id: String(e.id),
    date: e.date || new Date().toISOString().split('T')[0],
    goodEggs: Number(e.goodEggs) || 0,
    brokenEggs: Number(e.brokenEggs) || 0,
    spoiltEggs: Number(e.spoiltEggs) || 0,
    batchId: String(e.batchId || 'b1'),
  }));

  const normalizedAudits = (cushionAudits || []).map((a: any) => ({
    id: String(a.id),
    date: a.date || new Date().toISOString().split('T')[0],
    boxName: String(a.boxName || 'Nesting Box 1'),
    status: String(a.status || 'Optimal Cushioning'),
    actionTaken: String(a.actionTaken || 'No action required'),
  }));

  const normalizedMaturation = (maturationLogs || []).map((m: any) => ({
    id: String(m.id),
    date: m.date || new Date().toISOString().split('T')[0],
    birdId: String(m.birdId || 'BIRD-01'),
    breed: String(m.breed || 'Isa Brown'),
    eggsCount: Number(m.eggsCount) || 0,
    avgWeightGrams: Number(m.avgWeightGrams) || 0,
    notes: String(m.notes || ''),
  }));

  return NextResponse.json({
    eggs: normalizedEggs,
    cushionAudits: normalizedAudits,
    maturationLogs: normalizedMaturation
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
        boxName: body.boxName || 'Box #1',
        status: body.status || 'Optimal Cushioning',
        actionTaken: body.actionTaken || 'No action recorded'
      };
      
      const { error: insErr } = await supabase.from('cushionAudits').insert([newAudit]);
      if (insErr) {
        return NextResponse.json({ error: insErr.message || 'Failed to record cushion audit' }, { status: 500 });
      }
      
      if (body.status === 'Optimal Cushioning') {
        await supabase.from('alertLogs').insert([{
          id: 'al-' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `INFO: Cushion audit complete. Nesting box ${newAudit.boxName} cushion is optimal.`,
          severity: 'Info'
        }]);
      } else {
        await supabase.from('alertLogs').insert([{
          id: 'al-' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `WARNING: Cushion audit on ${newAudit.boxName} found status "${newAudit.status}". Action taken: ${newAudit.actionTaken}`,
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
        birdId: body.birdId || 'BIRD-01',
        breed: body.breed || 'Isa Brown',
        eggsCount: Number(body.eggsCount) || 0,
        avgWeightGrams: Number(body.avgWeightGrams) || 0,
        notes: body.notes || 'Maturing normally'
      };
      
      const { error: insErr } = await supabase.from('maturationLogs').insert([newMatLog]);
      if (insErr) {
        return NextResponse.json({ error: insErr.message || 'Failed to record maturation log' }, { status: 500 });
      }

      await supabase.from('alertLogs').insert([{
        id: 'al-' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `INFO: Maturation record logged for bird ${newMatLog.birdId}. Eggs count: ${newMatLog.eggsCount}, Avg Weight: ${newMatLog.avgWeightGrams}g.`,
        severity: 'Info'
      }]);
      return NextResponse.json(newMatLog, { status: 201 });
    }

    const newRecord = {
      id: 'e-' + Date.now(),
      workspaceId,
      date: body.date || new Date().toISOString().split('T')[0],
      goodEggs: Number(body.goodEggs) || 0,
      brokenEggs: Number(body.brokenEggs) || 0,
      spoiltEggs: Number(body.spoiltEggs) || 0,
      batchId: body.batchId || 'b1'
    };
    
    const { error: insErr } = await supabase.from('eggs').insert([newRecord]);
    if (insErr) {
      return NextResponse.json({ error: insErr.message || 'Failed to record eggs' }, { status: 500 });
    }
    
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
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to record eggs' }, { status: 500 });
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
        .eq('id', body.id).eq('workspaceId', workspaceId);
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
        .eq('id', body.id).eq('workspaceId', workspaceId);
      return NextResponse.json({ success: true });
    }

    await supabase.from('eggs')
      .update({
        goodEggs: body.goodEggs,
        brokenEggs: body.brokenEggs,
        spoiltEggs: body.spoiltEggs
      })
      .eq('id', body.id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();

    if (body.action === 'deleteAudit') {
      await supabase.from('cushionAudits').delete().eq('id', body.id).eq('workspaceId', workspaceId);
      return NextResponse.json({ success: true });
    }

    if (body.action === 'deleteMaturation') {
      await supabase.from('maturationLogs').delete().eq('id', body.id).eq('workspaceId', workspaceId);
      return NextResponse.json({ success: true });
    }

    await supabase.from('eggs').delete().eq('id', body.id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
