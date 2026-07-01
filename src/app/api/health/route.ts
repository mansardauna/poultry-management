'use strict';
import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [templates, schedules] = await Promise.all([
    db.select().from(schema.medicationTemplates).where(eq(schema.medicationTemplates.workspaceId, workspaceId)),
    db.select().from(schema.medicationSchedules).where(eq(schema.medicationSchedules.workspaceId, workspaceId))
  ]);
  return NextResponse.json({
    templates,
    schedules
  });
}

/** Exported function POST */
export async function POST(req: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await req.json();
    const { action } = body;

    if (action === 'addTemplate') {
      const newTemplate = {
        id: `TMP-${Date.now()}`,
        workspaceId,
        name: body.name,
        targetType: body.targetType,
        stages: body.stages
      };
      await db.insert(schema.medicationTemplates).values(newTemplate);
      return NextResponse.json({ success: true, template: newTemplate });
    }

    if (action === 'completeSchedule') {
      const { id } = body;
      await db.update(schema.medicationSchedules).set({ status: 'Completed' }).where(and(eq(schema.medicationSchedules.id, id), eq(schema.medicationSchedules.workspaceId, workspaceId)));
      return NextResponse.json({ success: true });
    }

    if (action === 'applyTemplate') {
      const { templateId, batchId, startDate } = body;
      const templates = await db.select().from(schema.medicationTemplates).where(and(eq(schema.medicationTemplates.id, templateId), eq(schema.medicationTemplates.workspaceId, workspaceId)));
      const template = templates.length > 0 ? templates[0] : null;

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      const start = new Date(startDate);
      const newSchedules = (template.stages as any[]).map((stage: any, i: number) => {
        const schedDate = new Date(start);
        schedDate.setDate(schedDate.getDate() + stage.dayOffset);
        return {
          id: `SCH-${Date.now()}-${i}`,
          workspaceId,
          batchId,
          medicationName: stage.medicationName,
          type: stage.type,
          scheduledDate: schedDate.toISOString().split('T')[0],
          status: 'Pending'
        };
      });

      await db.insert(schema.medicationSchedules).values(newSchedules);
      return NextResponse.json({ success: true, schedules: newSchedules });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

/** Exported function PUT */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    if (body.action === 'updateTemplate') {
      await db.update(schema.medicationTemplates)
        .set({ name: body.name, targetType: body.targetType })
        .where(and(eq(schema.medicationTemplates.id, body.id), eq(schema.medicationTemplates.workspaceId, workspaceId)));
    } else {
      await db.update(schema.medicationSchedules)
        .set({ medicationName: body.medicationName, scheduledDate: body.scheduledDate, status: body.status })
        .where(and(eq(schema.medicationSchedules.id, body.id), eq(schema.medicationSchedules.workspaceId, workspaceId)));
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    if (type === 'template') {
      await db.delete(schema.medicationTemplates).where(and(eq(schema.medicationTemplates.id, id), eq(schema.medicationTemplates.workspaceId, workspaceId)));
    } else {
      await db.delete(schema.medicationSchedules).where(and(eq(schema.medicationSchedules.id, id), eq(schema.medicationSchedules.workspaceId, workspaceId)));
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
