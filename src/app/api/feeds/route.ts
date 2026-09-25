'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';

/**
 * GET /api/feeds
 * Returns all feed inventory records, daily feed logs, and procurement pipeline entries
 * for the current workspace.
 */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [
    { data: feeds },
    { data: feedLogs },
    { data: procurePipeline }
  ] = await Promise.all([
    applyWorkspaceFilter(supabase.from('feeds').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('feedLogs').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('procurePipeline').select('*'), workspaceId)
  ]);

  const normalizedFeeds = (feeds || []).map((f: any) => ({
    id: String(f.id),
    type: f.type || 'Layer mash',
    quantityKg: Number(f.quantityKg) || 0,
    supplier: f.supplier || 'Generic Supplier',
    lastRestock: f.lastRestock || new Date().toISOString().split('T')[0]
  }));

  const normalizedLogs = (feedLogs || []).map((fl: any) => ({
    id: String(fl.id),
    date: fl.date || new Date().toISOString().split('T')[0],
    feedId: String(fl.feedId || 'f1'),
    quantityConsumedKg: Number(fl.quantityConsumedKg) || 0,
    batchId: String(fl.batchId || 'b1')
  }));

  const normalizedPipeline = (procurePipeline || []).map((p: any) => ({
    id: String(p.id),
    date: p.date || new Date().toISOString().split('T')[0],
    milestone: p.milestone || '',
    supplier: p.supplier || 'Generic Supplier',
    status: p.status || 'Under Negotiations',
    eta: p.eta || 'Pending'
  }));

  return NextResponse.json({ feeds: normalizedFeeds, feedLogs: normalizedLogs, procurePipeline: normalizedPipeline });
}

/**
 * POST /api/feeds
 */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();

    if (body.action === 'logisticsProcure') {
      const newPipe = {
        id: 'pipe-' + Date.now(),
        workspaceId,
        date: body.date || new Date().toISOString().split('T')[0],
        milestone: body.milestone || 'Feed Procurement',
        supplier: body.supplier || 'Generic Supplier',
        status: body.status || 'Under Negotiations',
        eta: body.eta || 'Pending'
      };

      const { error: insErr } = await supabase.from('procurePipeline').insert([newPipe]);
      if (insErr) {
        return NextResponse.json({ error: insErr.message || 'Failed to add procurement milestone' }, { status: 500 });
      }

      await supabase.from('alertLogs').insert([{
        id: 'al-' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `INFO: Logistics procurement step logged: "${newPipe.milestone}" with ${newPipe.supplier}.`,
        severity: 'Info'
      }]);

      return NextResponse.json(newPipe, { status: 201 });
    }

    if (body.action === 'restock') {
      const { data: feedResult } = await supabase.from('feeds').select('*').eq('id', body.feedId).eq('workspaceId', workspaceId);
      const quantityKg = Number(body.quantityKg) || 0;
      let feedType: string;
      let newQuantityKg: number;
      let restockObj: any;

      if (feedResult && feedResult.length > 0) {
        const feed = feedResult[0];
        newQuantityKg = feed.quantityKg + quantityKg;
        feedType = feed.type;
        restockObj = {
          ...feed,
          quantityKg: newQuantityKg,
          lastRestock: body.date || new Date().toISOString().split('T')[0],
          supplier: body.supplier || feed.supplier
        };
        await supabase.from('feeds').update({
          quantityKg: newQuantityKg,
          lastRestock: restockObj.lastRestock,
          supplier: restockObj.supplier
        }).eq('id', feed.id);
      } else {
        feedType = body.type || 'Layer mash';
        newQuantityKg = quantityKg;
        restockObj = {
          id: 'f-' + Date.now(),
          workspaceId,
          type: feedType,
          quantityKg: newQuantityKg,
          supplier: body.supplier || 'Generic Supplier',
          lastRestock: body.date || new Date().toISOString().split('T')[0]
        };
        await supabase.from('feeds').insert([restockObj]);
      }

      const { data: alertSettingsResult } = await supabase.from('alertSettings')
        .select('*').eq('workspaceId', workspaceId).limit(1);
      const feedThresholdKg = alertSettingsResult && alertSettingsResult.length > 0 ? alertSettingsResult[0].feedThresholdKg : 50;

      if (newQuantityKg > feedThresholdKg) {
        await supabase.from('alertLogs').insert([{
          id: 'al-' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `INFO: Feed stock level for ${feedType} recovered to ${newQuantityKg}kg. Safety threshold cleared.`,
          severity: 'Info'
        }]);
      }

      const amountSpent = Number(body.amountSpent) || (quantityKg * 800);
      await supabase.from('expenses').insert([{
        id: 'ex-' + Date.now(),
        workspaceId,
        date: body.date || new Date().toISOString().split('T')[0],
        category: 'Feed',
        amount: amountSpent,
        description: `Purchased ${quantityKg}kg of ${feedType} from ${body.supplier || 'Supplier'}`
      }]);

      return NextResponse.json(restockObj, { status: 201 });
    } else {
      // Default: log daily consumption
      const newLog = {
        id: 'fl-' + Date.now(),
        workspaceId,
        date: body.date || new Date().toISOString().split('T')[0],
        feedId: body.feedId || 'f1',
        quantityConsumedKg: Number(body.quantityKg) || Number(body.quantityConsumedKg) || 0,
        batchId: body.batchId || 'b1'
      };

      const { data: feedResult } = await supabase.from('feeds').select('*').eq('id', body.feedId).eq('workspaceId', workspaceId);
      const feed = feedResult && feedResult.length > 0 ? feedResult[0] : null;

      if (feed) {
        const newQty = Math.max(0, feed.quantityKg - newLog.quantityConsumedKg);
        await supabase.from('feeds').update({ quantityKg: newQty }).eq('id', feed.id);

        const { data: alertSettingsResult } = await supabase.from('alertSettings')
          .select('*').eq('workspaceId', workspaceId).limit(1);
        const feedThresholdKg = alertSettingsResult && alertSettingsResult.length > 0 ? alertSettingsResult[0].feedThresholdKg : 50;

        if (newQty <= feedThresholdKg) {
          await supabase.from('alertLogs').insert([{
            id: 'al-' + Date.now(),
            workspaceId,
            date: new Date().toISOString().split('T')[0],
            message: `CRITICAL: Feed stock level for ${feed.type} drops to ${newQty}kg (safety threshold: ${feedThresholdKg}kg)!`,
            severity: 'Critical'
          }]);
        }
      }
      const { error: insErr } = await supabase.from('feedLogs').insert([newLog]);
      if (insErr) {
        return NextResponse.json({ error: insErr.message || 'Failed to log feed consumption' }, { status: 500 });
      }
      return NextResponse.json(newLog, { status: 201 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to update feeds' }, { status: 500 });
  }
}

/**
 * PUT /api/feeds
 * Updates an existing feed log or procurement pipeline entry.
 * Detects the target via `body.action === 'updatePipeline'`.
 */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();

    if (body.action === 'updatePipeline') {
      await supabase.from('procurePipeline').update({
        milestone: body.milestone,
        supplier: body.supplier,
        status: body.status,
        eta: body.eta
      }).eq('id', body.id).eq('workspaceId', workspaceId);
      return NextResponse.json({ success: true });
    }

    await supabase.from('feedLogs').update({
      quantityConsumedKg: body.quantityConsumedKg
    }).eq('id', body.id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}

/**
 * DELETE /api/feeds
 * Deletes a feed log or procurement pipeline entry by ID.
 * Detects the target via `body.action === 'deletePipeline'`.
 */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();

    if (body.action === 'deletePipeline') {
      await supabase.from('procurePipeline').delete().eq('id', body.id).eq('workspaceId', workspaceId);
      return NextResponse.json({ success: true });
    }

    await supabase.from('feedLogs').delete().eq('id', body.id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
