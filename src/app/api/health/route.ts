'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [templatesRes, schedulesRes] = await Promise.all([
    supabase.from('medicationTemplates').select('*').eq('workspaceId', workspaceId),
    supabase.from('medicationSchedules').select('*').eq('workspaceId', workspaceId)
  ]);
  return NextResponse.json({
    templates: templatesRes.data || [],
    schedules: schedulesRes.data || []
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
      await supabase.from('medicationTemplates').insert([newTemplate]);
      return NextResponse.json({ success: true, template: newTemplate });
    }

    if (action === 'completeSchedule') {
      const { id } = body;
      await supabase.from('medicationSchedules').update({ status: 'Completed' }).eq('id', id).eq('workspaceId', workspaceId);
      return NextResponse.json({ success: true });
    }

    if (action === 'applyTemplate') {
      const { templateId, batchId, startDate } = body;
      const { data: templates } = await supabase.from('medicationTemplates').select('*').eq('id', templateId).eq('workspaceId', workspaceId);
      const template = templates && templates.length > 0 ? templates[0] : null;

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

      await supabase.from('medicationSchedules').insert(newSchedules);
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
      await supabase.from('medicationTemplates')
        .update({ name: body.name, targetType: body.targetType })
        .eq('id', body.id).eq('workspaceId', workspaceId);
    } else {
      await supabase.from('medicationSchedules')
        .update({ medicationName: body.medicationName, scheduledDate: body.scheduledDate, status: body.status })
        .eq('id', body.id).eq('workspaceId', workspaceId);
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
      await supabase.from('medicationTemplates').delete().eq('id', id).eq('workspaceId', workspaceId);
    } else {
      await supabase.from('medicationSchedules').delete().eq('id', id).eq('workspaceId', workspaceId);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
