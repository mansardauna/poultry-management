import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

export async function GET() {
  const workspaceId = await getWorkspaceId();
  const equipment = await db.select().from(schema.equipment).where(eq(schema.equipment.workspaceId, workspaceId));
  return NextResponse.json({
    equipment: equipment || []
  });
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    const newId = 'eq' + Date.now().toString().slice(-8);

    const [newEquipment] = await db.insert(schema.equipment).values({
      id: newId,
      workspaceId,
      name: body.name,
      type: body.type || 'Other',
      quantity: Number(body.quantity) || 1,
      status: body.status || 'Good',
      lastMaintenance: body.lastMaintenance || new Date().toISOString().split('T')[0]
    }).returning();
    
    return NextResponse.json(newEquipment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add equipment' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.update(schema.equipment).set(fields).where(and(eq(schema.equipment.id, id), eq(schema.equipment.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(schema.equipment).where(and(eq(schema.equipment.id, id), eq(schema.equipment.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 });
  }
}
