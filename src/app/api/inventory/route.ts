'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const { data: equipment } = await applyWorkspaceFilter(supabase.from('equipment').select('*'), workspaceId);
  const formatted = (equipment || []).map((eq: any) => ({
    ...eq,
    quantity: Number(eq.quantity || 0)
  }));
  return NextResponse.json({
    equipment: formatted
  });
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    const newId = 'eq' + Date.now().toString().slice(-8);

    const { data, error } = await supabase.from('equipment').insert([{
      id: newId,
      workspaceId,
      name: body.name,
      type: body.type || 'Other',
      quantity: Number(body.quantity) || 1,
      status: body.status || 'Good',
      lastMaintenance: body.lastMaintenance || new Date().toISOString().split('T')[0]
    }]).select();
    
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    const newEquipment = data?.[0] || {
      id: newId,
      workspaceId,
      name: body.name,
      type: body.type || 'Other',
      quantity: Number(body.quantity) || 1,
      status: body.status || 'Good',
      lastMaintenance: body.lastMaintenance || new Date().toISOString().split('T')[0]
    };
    
    return NextResponse.json(newEquipment, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add equipment' }, { status: 500 });
  }
}

/** Exported function PUT */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const { error } = await supabase.from('equipment').update(fields).eq('id', id).eq('workspaceId', workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, ...body });
  } catch {
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    const { error } = await supabase.from('equipment').delete().eq('id', id).eq('workspaceId', workspaceId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}
