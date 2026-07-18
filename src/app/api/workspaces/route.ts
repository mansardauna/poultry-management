'use strict';
'use server';

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/** Exported function GET */
export async function GET() {
  const { data: workspaces } = await supabase.from('workspaces').select('*');

  if (!workspaces || workspaces.length === 0) {
    const defaultWorkspace = {
      id: 'main',
      name: 'Main Farm',
      type: 'Main',
      createdAt: new Date().toISOString(),
    };
    await supabase.from('workspaces').insert([defaultWorkspace]);
    return NextResponse.json([defaultWorkspace]);
  }

  return NextResponse.json(workspaces);
}

/** Exported function POST */
export async function POST(request: Request) {
  const body = await request.json();

  if (!body?.id || !body?.name || !body?.type) {
    return NextResponse.json({ error: 'Missing workspace id, name, or type' }, { status: 400 });
  }

  const createdWorkspace = {
    id: body.id,
    name: body.name,
    type: body.type,
    createdAt: new Date().toISOString(),
  };

  await supabase.from('workspaces').insert([createdWorkspace]);
  return NextResponse.json(createdWorkspace, { status: 201 });
}

/** Exported function PUT */
export async function PUT(request: Request) {
  const body = await request.json();
  const { id, name, type } = body;

  if (!id || !name || !type) {
    return NextResponse.json({ error: 'Missing id, name, or type' }, { status: 400 });
  }

  await supabase.from('workspaces')
    .update({ name, type })
    .eq('id', id);

  return NextResponse.json({ success: true });
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing workspace id' }, { status: 400 });
  }

  if (id === 'main') {
    return NextResponse.json({ error: 'Cannot delete the main workspace' }, { status: 400 });
  }

  await supabase.from('workspaces').delete().eq('id', id);
  return NextResponse.json({ success: true });
}
