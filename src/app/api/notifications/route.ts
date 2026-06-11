import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { eq, desc, and } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

export async function GET() {
  try {
    const workspaceId = await getWorkspaceId();
    const notifications = await db.select().from(schema.alertLogs).where(eq(schema.alertLogs.workspaceId, workspaceId)).orderBy(desc(schema.alertLogs.date));
    const formatted = notifications.map((log) => ({
      ...log,
      read: log.read ?? false,
    }));
    return NextResponse.json(formatted);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();

    if (body.action === 'markAllRead') {
      await db.update(schema.alertLogs).set({ read: true }).where(eq(schema.alertLogs.workspaceId, workspaceId));
    } else if (body.id) {
      await db.update(schema.alertLogs).set({ read: true }).where(and(eq(schema.alertLogs.id, body.id), eq(schema.alertLogs.workspaceId, workspaceId)));
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
