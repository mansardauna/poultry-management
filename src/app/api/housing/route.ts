'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [farmPensRes, batchesRes] = await Promise.all([
    supabase.from('farmPens').select('*').eq('workspaceId', workspaceId),
    supabase.from('batches').select('*').eq('workspaceId', workspaceId)
  ]);
  return NextResponse.json({
    farmPens: farmPensRes.data || [],
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
    
    await supabase.from('farmPens').insert([newPen]);
    
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
    await supabase.from('farmPens').update(fields).eq('id', id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
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
    await supabase.from('farmPens').delete().eq('id', id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete pen' }, { status: 500 });
  }
}
