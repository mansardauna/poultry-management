'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const { data: contactsData } = await supabase.from('contacts').select('*').eq('workspaceId', workspaceId);
  return NextResponse.json({
    contacts: contactsData || []
  });
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    const newContact = {
      id: 'c' + Date.now(),
      workspaceId,
      name: body.name,
      type: body.type || 'Customer',
      contactDetails: body.contactDetails || '',
      totalTransactions: Number(body.totalTransactions) || 0,
      notes: body.notes || ''
    };
    
    await supabase.from('contacts').insert([newContact]);
    
    return NextResponse.json(newContact, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to add contact' }, { status: 500 });
  }
}

/** Exported function PUT */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await supabase.from('contacts').update(fields).eq('id', id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await supabase.from('contacts').delete().eq('id', id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
