import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [farmPens, batches] = await Promise.all([
    db.select().from(schema.farmPens).where(eq(schema.farmPens.workspaceId, workspaceId)),
    db.select().from(schema.batches).where(eq(schema.batches.workspaceId, workspaceId))
  ]);
  return NextResponse.json({
    farmPens,
    batches
  });
}

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
    
    await db.insert(schema.farmPens).values(newPen);
    
    return NextResponse.json(newPen, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add farm pen' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.update(schema.farmPens).set(fields).where(and(eq(schema.farmPens.id, id), eq(schema.farmPens.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update pen' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(schema.farmPens).where(and(eq(schema.farmPens.id, id), eq(schema.farmPens.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete pen' }, { status: 500 });
  }
}
