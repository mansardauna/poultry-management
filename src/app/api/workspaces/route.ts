'use strict';
'use server';

import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { schema } from '@/lib/schema';
import { eq } from 'drizzle-orm';

/** Exported function GET */
export async function GET() {
  const workspaces = await db.select().from(schema.workspaces);

  if (workspaces.length === 0) {
    const defaultWorkspace = {
      id: 'main',
      name: 'Main Farm',
      type: 'Main',
      createdAt: new Date().toISOString(),
    };
    await db.insert(schema.workspaces).values(defaultWorkspace);
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

  await db.insert(schema.workspaces).values(createdWorkspace);
  return NextResponse.json(createdWorkspace, { status: 201 });
}

/** Exported function PUT */
export async function PUT(request: Request) {
  const body = await request.json();
  const { id, name, type } = body;

  if (!id || !name || !type) {
    return NextResponse.json({ error: 'Missing id, name, or type' }, { status: 400 });
  }

  await db.update(schema.workspaces)
    .set({ name, type })
    .where(eq(schema.workspaces.id, id));

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

  await db.delete(schema.workspaces).where(eq(schema.workspaces.id, id));
  return NextResponse.json({ success: true });
}
