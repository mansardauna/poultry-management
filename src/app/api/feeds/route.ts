'use strict';
import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

/**
 * GET /api/feeds
 * Returns all feed inventory records, daily feed logs, and procurement pipeline entries
 * for the current workspace.
 */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [feeds, feedLogs, procurePipeline] = await Promise.all([
    db.select().from(schema.feeds).where(eq(schema.feeds.workspaceId, workspaceId)),
    db.select().from(schema.feedLogs).where(eq(schema.feedLogs.workspaceId, workspaceId)),
    db.select().from(schema.procurePipeline).where(eq(schema.procurePipeline.workspaceId, workspaceId))
  ]);
  return NextResponse.json({ feeds, feedLogs, procurePipeline });
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

      await db.transaction(async (tx) => {
        await tx.insert(schema.procurePipeline).values(newPipe);
        await tx.insert(schema.alertLogs).values({
          id: 'al-' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `INFO: Logistics procurement step logged: "${body.milestone}" with ${body.supplier}.`,
          severity: 'Info'
        });
      });

      return NextResponse.json(newPipe, { status: 201 });
    }

    if (body.action === 'restock') {
      await db.transaction(async (tx) => {
        const feedResult = await tx.select().from(schema.feeds).where(
          and(eq(schema.feeds.id, body.feedId), eq(schema.feeds.workspaceId, workspaceId))
        );
        const quantityKg = Number(body.quantityKg);
        let feedType: string;
        let newQuantityKg: number;

        if (feedResult.length > 0) {
          const feed = feedResult[0];
          newQuantityKg = feed.quantityKg + quantityKg;
          feedType = feed.type;
          await tx.update(schema.feeds).set({
            quantityKg: newQuantityKg,
            lastRestock: body.date || new Date().toISOString().split('T')[0],
            supplier: body.supplier || feed.supplier
          }).where(eq(schema.feeds.id, feed.id));
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
          await tx.insert(schema.feeds).values(newFeed);
        }

        const alertSettingsResult = await tx.select().from(schema.alertSettings)
          .where(eq(schema.alertSettings.workspaceId, workspaceId)).limit(1);
        const feedThresholdKg = alertSettingsResult.length > 0 ? alertSettingsResult[0].feedThresholdKg : 50;

        if (newQuantityKg > feedThresholdKg) {
          await tx.insert(schema.alertLogs).values({
            id: 'al-' + Date.now(),
            workspaceId,
            date: new Date().toISOString().split('T')[0],
            message: `INFO: Feed stock level for ${feedType} recovered to ${newQuantityKg}kg. Safety threshold cleared.`,
            severity: 'Info'
          });
        }

        const amountSpent = Number(body.amountSpent) || (quantityKg * 800);
        await tx.insert(schema.expenses).values({
          id: 'ex-' + Date.now(),
          workspaceId,
          date: body.date || new Date().toISOString().split('T')[0],
          category: 'Feed',
          amount: amountSpent,
          description: `Purchased ${quantityKg}kg of ${feedType} from ${body.supplier || 'Supplier'}`
        });
      });
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

      await db.transaction(async (tx) => {
        const feedResult = await tx.select().from(schema.feeds).where(
          and(eq(schema.feeds.id, body.feedId), eq(schema.feeds.workspaceId, workspaceId))
        );
        const feed = feedResult.length > 0 ? feedResult[0] : null;

        if (feed) {
          const newQty = Math.max(0, feed.quantityKg - Number(body.quantityKg));
          await tx.update(schema.feeds).set({ quantityKg: newQty }).where(eq(schema.feeds.id, feed.id));

          const alertSettingsResult = await tx.select().from(schema.alertSettings)
            .where(eq(schema.alertSettings.workspaceId, workspaceId)).limit(1);
          const feedThresholdKg = alertSettingsResult.length > 0 ? alertSettingsResult[0].feedThresholdKg : 50;

          if (newQty <= feedThresholdKg) {
            await tx.insert(schema.alertLogs).values({
              id: 'al-' + Date.now(),
              workspaceId,
              date: new Date().toISOString().split('T')[0],
              message: `CRITICAL: Feed stock level for ${feed.type} drops to ${newQty}kg (safety threshold: ${feedThresholdKg}kg)!`,
              severity: 'Critical'
            });

            const taskResult = await tx.select().from(schema.tasks).where(
              and(eq(schema.tasks.status, 'Pending'), eq(schema.tasks.workspaceId, workspaceId))
            );
            const taskExists = taskResult.some((t) => (t as { taskName: string }).taskName.includes(`Replenish ${feed.type}`));
            if (!taskExists) {
              await tx.insert(schema.tasks).values({
                id: 't-' + Date.now(),
                workspaceId,
                assignedTo: 'Abdulrahman Monsur',
                taskName: `Replenish ${feed.type} stock immediately (Current: ${newQty}kg)`,
                status: 'Pending',
                date: new Date().toISOString().split('T')[0]
              });
            }
          }
        }
        await tx.insert(schema.feedLogs).values(newLog);
      });
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
      await db.update(schema.procurePipeline).set({
        milestone: body.milestone,
        supplier: body.supplier,
        status: body.status,
        eta: body.eta
      }).where(and(eq(schema.procurePipeline.id, body.id), eq(schema.procurePipeline.workspaceId, workspaceId)));
      return NextResponse.json({ success: true });
    }

    await db.update(schema.feedLogs).set({
      quantityConsumedKg: body.quantityConsumedKg
    }).where(and(eq(schema.feedLogs.id, body.id), eq(schema.feedLogs.workspaceId, workspaceId)));
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
      await db.delete(schema.procurePipeline).where(
        and(eq(schema.procurePipeline.id, body.id), eq(schema.procurePipeline.workspaceId, workspaceId))
      );
      return NextResponse.json({ success: true });
    }

    await db.delete(schema.feedLogs).where(
      and(eq(schema.feedLogs.id, body.id), eq(schema.feedLogs.workspaceId, workspaceId))
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
