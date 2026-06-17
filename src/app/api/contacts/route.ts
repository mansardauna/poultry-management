'use strict';
import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const contactsData = await db.select().from(schema.contacts).where(eq(schema.contacts.workspaceId, workspaceId));
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
    
    await db.insert(schema.contacts).values(newContact);
    
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
    await db.update(schema.contacts).set(fields).where(and(eq(schema.contacts.id, id), eq(schema.contacts.workspaceId, workspaceId)));
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
    await db.delete(schema.contacts).where(and(eq(schema.contacts.id, id), eq(schema.contacts.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
