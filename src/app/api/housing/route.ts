'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [farmPensRes, batchesRes] = await Promise.all([
    applyWorkspaceFilter(supabase.from('farmPens').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('batches').select('*'), workspaceId)
  ]);
  const farmPens = (farmPensRes.data || []).map((p: any) => ({
    ...p,
    capacity: Number(p.capacity || 0)
  }));
  return NextResponse.json({
    farmPens,
    batches: batchesRes.data || []
  });
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    // We assume farmPens auto-generates id or we handle it
    const newPen = {
      id: 'p-' + Date.now(),
      workspaceId,
      name: body.name,
      capacity: Number(body.capacity) || 0,
      currentBatchId: body.currentBatchId || null,
      status: body.status || 'Active',
      temperatureLogs: body.temperatureLogs || []
    };
    
    const { error } = await supabase.from('farmPens').insert([newPen]);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(newPen, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add farm pen' }, { status: 500 });
  }
}

/** Exported function PUT */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const { error } = await supabase.from('farmPens').update(fields).eq('id', id).eq('workspaceId', workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, ...body });
  } catch {
    return NextResponse.json({ error: 'Failed to update pen' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const { error } = await supabase.from('farmPens').delete().eq('id', id).eq('workspaceId', workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete pen' }, { status: 500 });
  }
}
