'use server';

import { NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { db } from '@/lib/drizzle';
import { schema } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const databaseUrl = process.env.DATABASE_URL ?? 'file:src/data/database.sqlite';
const authToken = process.env.DATABASE_AUTH_TOKEN;

function getRawClient() {
  return createClient({
    url: databaseUrl,
    ...(authToken ? { authToken } : {})
  });
}

async function ensureWorkspaceTable() {
  const client = getRawClient();
  await client.execute({
    sql: `CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )`
  });
  await client.close();
}

export async function GET() {
  await ensureWorkspaceTable();
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

export async function POST(request: Request) {
  await ensureWorkspaceTable();
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

export async function PUT(request: Request) {
  await ensureWorkspaceTable();
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

export async function DELETE(request: Request) {
  await ensureWorkspaceTable();
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
