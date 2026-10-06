'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  if (workspaceId === '__unauthenticated__') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [
    { data: eggs },
    { data: cushionAudits },
    { data: maturationLogs }
  ] = await Promise.all([
    applyWorkspaceFilter(supabase.from('eggs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('cushionAudits').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('maturationLogs').select('*'), workspaceId)
  ]);
  
  const normalizedEggs = (eggs || []).map((e: Record<string, unknown>) => ({
    id: String(e.id),
    date: (e.date as string) || new Date().toISOString().split('T')[0],
    goodEggs: Number(e.goodEggs) || 0,
    brokenEggs: Number(e.brokenEggs) || 0,
    spoiltEggs: Number(e.spoiltEggs) || 0,
    batchId: String(e.batchId || 'b1'),
  }));

  const normalizedAudits = (cushionAudits || []).map((a: Record<string, unknown>) => ({
    id: String(a.id),
    date: (a.date as string) || new Date().toISOString().split('T')[0],
    boxName: String(a.boxName || 'Nesting Box 1'),
    status: String(a.status || 'Optimal Cushioning'),
    actionTaken: String(a.actionTaken || 'No action required'),
  }));

  const normalizedMaturation = (maturationLogs || []).map((m: Record<string, unknown>) => ({
    id: String(m.id),
    date: (m.date as string) || new Date().toISOString().split('T')[0],
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
    if (workspaceId === '__unauthenticated__') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    
    // Re-evaluate egg production thresholds using the day's full aggregate for this batch
    await evaluateEggProductionThresholds(workspaceId, newRecord.batchId, newRecord.date);
    
    return NextResponse.json(newRecord, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as { message?: string })?.message || 'Failed to record eggs' }, { status: 500 });
  }
}

/**
 * Evaluates daily egg aggregate per batch and workspace:
 * - Sums all records on the target date (morning + afternoon + evening collections)
 * - Compares daily aggregate against minDailyEggCount and against previous logged day's total
 * - De-duplicates and upserts alertLogs and tasks using deterministic prefixes
 * - Cleans up stale alerts when thresholds are satisfied or records edited/removed
 */
async function evaluateEggProductionThresholds(workspaceId: string, batchId: string, targetDate: string) {
  try {
    const { data: alertSettingsRows } = await supabase
      .from('alertSettings')
      .select('*')
      .eq('workspaceId', workspaceId)
      .limit(1);
    const alertSettings = alertSettingsRows?.[0] || {};
    const eggDropThresholdPct = Number(alertSettings.eggDropPercentage) || 15;
    const minDailyEggThreshold = Number(alertSettings.minDailyEggCount) || 0;

    // 1. Re-query all records for targetDate + batchId (including newly inserted/updated ones)
    const { data: dayRecords } = await supabase
      .from('eggs')
      .select('*')
      .eq('workspaceId', workspaceId)
      .eq('batchId', batchId)
      .eq('date', targetDate);

    const dailyGood = (dayRecords || []).reduce((sum: number, r: Record<string, unknown>) => sum + (Number(r.goodEggs) || 0), 0);
    const dailyBroken = (dayRecords || []).reduce((sum: number, r: Record<string, unknown>) => sum + (Number(r.brokenEggs) || 0), 0);
    const dailySpoilt = (dayRecords || []).reduce((sum: number, r: Record<string, unknown>) => sum + (Number(r.spoiltEggs) || 0), 0);
    const dailyTotal = dailyGood + dailyBroken + dailySpoilt;

    // Optional workspace-wide rollup for context
    const { data: wsDayRecords } = await supabase
      .from('eggs')
      .select('*')
      .eq('workspaceId', workspaceId)
      .eq('date', targetDate);
    const wsDailyTotal = (wsDayRecords || []).reduce((sum: number, r: Record<string, unknown>) => 
      sum + (Number(r.goodEggs) || 0) + (Number(r.brokenEggs) || 0) + (Number(r.spoiltEggs) || 0), 0);

    // 2. Query preceding distinct date for this batch to evaluate drop consistently (handles backdated logs)
    const { data: priorRecords } = await supabase
      .from('eggs')
      .select('*')
      .eq('workspaceId', workspaceId)
      .eq('batchId', batchId)
      .lt('date', targetDate)
      .order('date', { ascending: false });

    let prevDayTotal = 0;
    let prevDate = '';
    if (priorRecords && priorRecords.length > 0) {
      prevDate = (priorRecords[0].date as string) || '';
      prevDayTotal = priorRecords
        .filter((r: Record<string, unknown>) => r.date === prevDate)
        .reduce((sum: number, r: Record<string, unknown>) => sum + (Number(r.goodEggs) || 0) + (Number(r.brokenEggs) || 0) + (Number(r.spoiltEggs) || 0), 0);
    }

    // Prefixes for deterministic de-duplication
    const cushionPrefix = `[CUSHION_BATCH_${batchId}]`;
    const minPrefix = `[MIN_YIELD_BATCH_${batchId}]`;
    const dropPrefix = `[DROP_YIELD_BATCH_${batchId}]`;

    const { data: existingAlerts } = await supabase
      .from('alertLogs')
      .select('*')
      .eq('workspaceId', workspaceId)
      .eq('date', targetDate);

    const findAlert = (prefix: string) => 
      (existingAlerts || []).find((a: Record<string, unknown>) => typeof a.message === 'string' && a.message.includes(prefix));

    // A) Cracked/broken cushioning check
    const existingCushionAlert = findAlert(cushionPrefix);
    if (dailyBroken > 0) {
      const cushionMsg = `${cushionPrefix} WARNING: ${dailyBroken} cracked/broken eggs logged for Batch ${batchId} on ${targetDate}. Nesting box cushioning audit recommended.`;
      if (existingCushionAlert) {
        await supabase.from('alertLogs').update({ message: cushionMsg, severity: 'Warning' }).eq('id', existingCushionAlert.id);
      } else {
        await supabase.from('alertLogs').insert([{
          id: 'al-' + Date.now() + '-cushion',
          workspaceId,
          date: targetDate,
          message: cushionMsg,
          severity: 'Warning'
        }]);
        await supabase.from('tasks').insert([{
          id: 't-' + Date.now().toString().slice(-8),
          workspaceId,
          assignedTo: 'Flock Manager',
          taskName: `Audit nesting box cushioning: Batch ${batchId} recorded ${dailyBroken} cracked eggs on ${targetDate}`,
          status: 'Pending',
          date: targetDate
        }]);
      }
    } else if (existingCushionAlert) {
      await supabase.from('alertLogs').delete().eq('id', existingCushionAlert.id);
    }

    // B) Minimum Daily Yield Check (Per Batch + Workspace Rollup)
    // Equality edge case: strictly less than minDailyEggThreshold triggers alert
    const existingMinAlert = findAlert(minPrefix);
    if (minDailyEggThreshold > 0 && (dayRecords && dayRecords.length > 0) && dailyTotal < minDailyEggThreshold) {
      const minMsg = `${minPrefix} CRITICAL: Daily egg yield for Batch ${batchId} (${dailyTotal} eggs) is below the configured daily minimum threshold (${minDailyEggThreshold} eggs) on ${targetDate} (Farm total: ${wsDailyTotal}).`;
      if (existingMinAlert) {
        await supabase.from('alertLogs').update({ message: minMsg, severity: 'Critical' }).eq('id', existingMinAlert.id);
      } else {
        await supabase.from('alertLogs').insert([{
          id: 'al-' + Date.now() + '-min',
          workspaceId,
          date: targetDate,
          message: minMsg,
          severity: 'Critical'
        }]);
        await supabase.from('tasks').insert([{
          id: 't-' + Date.now().toString().slice(-8),
          workspaceId,
          assignedTo: 'Flock Supervisor',
          taskName: `Investigate low daily egg yield: Batch ${batchId} produced ${dailyTotal} vs minimum threshold ${minDailyEggThreshold} eggs on ${targetDate}`,
          status: 'Pending',
          date: targetDate
        }]);
      }
    } else if (existingMinAlert) {
      await supabase.from('alertLogs').delete().eq('id', existingMinAlert.id);
    }

    // C) Production Drop Check compared to previous logged day's total
    const existingDropAlert = findAlert(dropPrefix);
    if (prevDayTotal > 0 && (dayRecords && dayRecords.length > 0) && dailyTotal < prevDayTotal) {
      const dropPct = ((prevDayTotal - dailyTotal) / prevDayTotal) * 100;
      if (dropPct >= eggDropThresholdPct) {
        const dropMsg = `${dropPrefix} CRITICAL: Batch ${batchId} daily egg output dropped by ${dropPct.toFixed(1)}% on ${targetDate} (from ${prevDayTotal} on ${prevDate} to ${dailyTotal} eggs), exceeding the ${eggDropThresholdPct}% alert limit!`;
        if (existingDropAlert) {
          await supabase.from('alertLogs').update({ message: dropMsg, severity: 'Critical' }).eq('id', existingDropAlert.id);
        } else {
          await supabase.from('alertLogs').insert([{
            id: 'al-' + Date.now() + '-drop',
            workspaceId,
            date: targetDate,
            message: dropMsg,
            severity: 'Critical'
          }]);
          await supabase.from('tasks').insert([{
            id: 't-' + Date.now().toString().slice(-8),
            workspaceId,
            assignedTo: 'Veterinarian / Farm Manager',
            taskName: `Urgent flock health check: Batch ${batchId} egg production dropped by ${dropPct.toFixed(1)}% on ${targetDate} (previous ${prevDate}: ${prevDayTotal} eggs)`,
            status: 'Pending',
            date: targetDate
          }]);
        }
      } else if (existingDropAlert) {
        await supabase.from('alertLogs').delete().eq('id', existingDropAlert.id);
      }
    } else if (existingDropAlert) {
      await supabase.from('alertLogs').delete().eq('id', existingDropAlert.id);
    }
  } catch (_alertErr) {}
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

    const { data: existingRows } = await supabase.from('eggs').select('*').eq('id', body.id).eq('workspaceId', workspaceId);
    const existingEgg = existingRows?.[0];

    const { error: updErr } = await supabase.from('eggs')
      .update({
        goodEggs: Number(body.goodEggs) || 0,
        brokenEggs: Number(body.brokenEggs) || 0,
        spoiltEggs: Number(body.spoiltEggs) || 0
      })
      .eq('id', body.id).eq('workspaceId', workspaceId);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    if (existingEgg) {
      await evaluateEggProductionThresholds(workspaceId, existingEgg.batchId, existingEgg.date);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let action = searchParams.get('action');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
      action = body.action || action;
    }

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 });
    }

    if (action === 'deleteAudit') {
      const { error } = await supabase.from('cushionAudits').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, deleted: 'audit' });
    }

    if (action === 'deleteMaturation') {
      const { error } = await supabase.from('maturationLogs').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, deleted: 'maturation' });
    }

    const { data: existingRows } = await supabase.from('eggs').select('*').eq('id', id).eq('workspaceId', workspaceId);
    const existingEgg = existingRows?.[0];

    const { error } = await supabase.from('eggs').delete().eq('id', id).eq('workspaceId', workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (existingEgg) {
      await evaluateEggProductionThresholds(workspaceId, existingEgg.batchId, existingEgg.date);
    }
    return NextResponse.json({ success: true, deleted: 'egg' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete record: ' + ((err as { message?: string })?.message || String(err)) }, { status: 500 });
  }
}
