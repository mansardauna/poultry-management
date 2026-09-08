'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

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
    supabase.from('feeds').select('*').eq('workspaceId', workspaceId),
    supabase.from('feedLogs').select('*').eq('workspaceId', workspaceId),
    supabase.from('procurePipeline').select('*').eq('workspaceId', workspaceId)
  ]);
  return NextResponse.json({ feeds: feeds || [], feedLogs: feedLogs || [], procurePipeline: procurePipeline || [] });
}

/**
 * POST /api/feeds
 * Handles three actions:
 * - `logisticsProcure`: Adds a new procurement pipeline milestone entry.
 * - `restock`: Restocks a feed inventory record (or creates a new one) and logs the associated expense.
 * - (default): Logs daily feed consumption and decrements the feed stock, triggering alerts if below threshold.
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
        milestone: body.milestone,
        supplier: body.supplier || 'Generic Supplier',
        status: body.status || 'Under Negotiations',
        eta: body.eta || 'Pending'
      };

      await supabase.from('procurePipeline').insert([newPipe]);
      await supabase.from('alertLogs').insert([{
        id: 'al-' + Date.now(),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `INFO: Logistics procurement step logged: "${body.milestone}" with ${body.supplier}.`,
        severity: 'Info'
      }]);

      return NextResponse.json(newPipe, { status: 201 });
    }

    if (body.action === 'restock') {
      const { data: feedResult } = await supabase.from('feeds').select('*').eq('id', body.feedId).eq('workspaceId', workspaceId);
      const quantityKg = Number(body.quantityKg);
      let feedType: string;
      let newQuantityKg: number;

      if (feedResult && feedResult.length > 0) {
        const feed = feedResult[0];
        newQuantityKg = feed.quantityKg + quantityKg;
        feedType = feed.type;
        await supabase.from('feeds').update({
          quantityKg: newQuantityKg,
          lastRestock: body.date || new Date().toISOString().split('T')[0],
          supplier: body.supplier || feed.supplier
        }).eq('id', feed.id);
      } else {
        feedType = body.type || 'Layer mash';
        newQuantityKg = quantityKg;
        const newFeed = {
          id: 'f-' + Date.now(),
          workspaceId,
          type: feedType,
          quantityKg: newQuantityKg,
          supplier: body.supplier || 'Generic Supplier',
          lastRestock: body.date || new Date().toISOString().split('T')[0]
        };
        await supabase.from('feeds').insert([newFeed]);
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
    } else {
      // Default: log daily consumption
      const newLog = {
        id: 'fl-' + Date.now(),
        workspaceId,
        date: body.date || new Date().toISOString().split('T')[0],
        feedId: body.feedId || 'f1',
        quantityConsumedKg: Number(body.quantityKg),
        batchId: body.batchId || 'b1'
      };

      const { data: feedResult } = await supabase.from('feeds').select('*').eq('id', body.feedId).eq('workspaceId', workspaceId);
      const feed = feedResult && feedResult.length > 0 ? feedResult[0] : null;

      if (feed) {
        const newQty = Math.max(0, feed.quantityKg - Number(body.quantityKg));
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

          const { data: taskResult } = await supabase.from('tasks').select('*').eq('status', 'Pending').eq('workspaceId', workspaceId);
          const taskExists = taskResult?.some((t) => (t as { taskName: string }).taskName.includes(`Replenish ${feed.type}`));
          if (!taskExists) {
            await supabase.from('tasks').insert([{
              id: 't-' + Date.now(),
              workspaceId,
              assignedTo: 'Abdulrahman Monsur',
              taskName: `Replenish ${feed.type} stock immediately (Current: ${newQty}kg)`,
              status: 'Pending',
              date: new Date().toISOString().split('T')[0]
            }]);
          }
        }
      }
      await supabase.from('feedLogs').insert([newLog]);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to update feeds' }, { status: 500 });
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
