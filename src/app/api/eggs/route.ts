'use strict';
import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [eggs, cushionAudits, maturationLogs] = await Promise.all([
    db.select().from(schema.eggs).where(eq(schema.eggs.workspaceId, workspaceId)),
    db.select().from(schema.cushionAudits).where(eq(schema.cushionAudits.workspaceId, workspaceId)),
    db.select().from(schema.maturationLogs).where(eq(schema.maturationLogs.workspaceId, workspaceId))
  ]);
  
  return NextResponse.json({
    eggs,
    cushionAudits,
    maturationLogs
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
      
      await db.transaction(async (tx) => {
        await tx.insert(schema.cushionAudits).values(newAudit);
        
        if (body.status === 'Optimal Cushioning') {
          await tx.insert(schema.alertLogs).values({
            id: 'al-' + Date.now(),
            workspaceId,
            date: new Date().toISOString().split('T')[0],
            message: `INFO: Cushion audit complete. Nesting box ${body.boxName} cushion is optimal.`,
            severity: 'Info'
          });
        } else {
          await tx.insert(schema.alertLogs).values({
            id: 'al-' + Date.now(),
            workspaceId,
            date: new Date().toISOString().split('T')[0],
            message: `WARNING: Cushion audit on ${body.boxName} found status "${body.status}". Action taken: ${body.actionTaken}`,
            severity: 'Warning'
          });
        }
      });
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
      
      await db.transaction(async (tx) => {
        await tx.insert(schema.maturationLogs).values(newMatLog);
        await tx.insert(schema.alertLogs).values({
          id: 'al-' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `INFO: Maturation record logged for bird ${body.birdId}. Eggs count: ${body.eggsCount}, Avg Weight: ${body.avgWeightGrams}g.`,
          severity: 'Info'
        });
      });
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
    
    await db.transaction(async (tx) => {
      await tx.insert(schema.eggs).values(newRecord);
      
      if (newRecord.brokenEggs > 0) {
        await tx.insert(schema.alertLogs).values({
          id: 'al-' + Date.now(),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `WARNING: ${newRecord.brokenEggs} cracked/broken eggs logged from Batch ${newRecord.batchId}. Cushioning audit suggested.`,
          severity: 'Warning'
        });
        
        await tx.insert(schema.tasks).values({
          id: 't-' + Date.now(),
          workspaceId,
          assignedTo: 'Abdulrahman Monsur',
          taskName: `Audit laying box cushioning due to cracked eggs in Batch ${newRecord.batchId}`,
          status: 'Pending',
          date: new Date().toISOString().split('T')[0]
        });
      }
    });
    
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
      await db.update(schema.cushionAudits)
        .set({
          boxName: body.boxName,
          status: body.status,
          actionTaken: body.actionTaken
        })
        .where(and(eq(schema.cushionAudits.id, body.id), eq(schema.cushionAudits.workspaceId, workspaceId)));
      return NextResponse.json({ success: true });
    }

    if (body.action === 'updateMaturation') {
      await db.update(schema.maturationLogs)
        .set({
          birdId: body.birdId,
          eggsCount: body.eggsCount,
          avgWeightGrams: body.avgWeightGrams,
          notes: body.notes
        })
        .where(and(eq(schema.maturationLogs.id, body.id), eq(schema.maturationLogs.workspaceId, workspaceId)));
      return NextResponse.json({ success: true });
    }

    await db.update(schema.eggs)
      .set({
        goodEggs: body.goodEggs,
        brokenEggs: body.brokenEggs,
        spoiltEggs: body.spoiltEggs
      })
      .where(and(eq(schema.eggs.id, body.id), eq(schema.eggs.workspaceId, workspaceId)));
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
      await db.delete(schema.cushionAudits).where(and(eq(schema.cushionAudits.id, body.id), eq(schema.cushionAudits.workspaceId, workspaceId)));
      return NextResponse.json({ success: true });
    }

    if (body.action === 'deleteMaturation') {
      await db.delete(schema.maturationLogs).where(and(eq(schema.maturationLogs.id, body.id), eq(schema.maturationLogs.workspaceId, workspaceId)));
      return NextResponse.json({ success: true });
    }

    await db.delete(schema.eggs).where(and(eq(schema.eggs.id, body.id), eq(schema.eggs.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete record' }, { status: 500 });
  }
}
