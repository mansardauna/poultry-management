import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import * as schema from '@/lib/schema';
import { and, eq } from 'drizzle-orm';
import { getWorkspaceId } from '@/lib/workspace';

export async function GET() {
  const workspaceId = await getWorkspaceId();
  const staff = await db.select().from(schema.staff).where(eq(schema.staff.workspaceId, workspaceId));
  const tasks = await db.select().from(schema.tasks).where(eq(schema.tasks.workspaceId, workspaceId));
  const payrollLogs = await db.select().from(schema.payrollLogs).where(eq(schema.payrollLogs.workspaceId, workspaceId));
  
  return NextResponse.json({
    staff,
    tasks,
    payrollLogs: payrollLogs || []
  });
}

export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'attendance') {
      const [member] = await db.select().from(schema.staff).where(and(eq(schema.staff.id, body.staffId), eq(schema.staff.workspaceId, workspaceId)));
      if (member) {
        const updatedAttendance = (member.attendanceDays || 0) + 1;
        await db.update(schema.staff).set({ attendanceDays: updatedAttendance }).where(and(eq(schema.staff.id, body.staffId), eq(schema.staff.workspaceId, workspaceId)));
        return NextResponse.json({ success: true, member: { ...member, attendanceDays: updatedAttendance } });
      }
      return NextResponse.json({ error: 'Staff member not found' }, { status: 440 });
    }

    if (body.action === 'assignTask') {
      const newTask = {
        id: 't' + Date.now().toString().slice(-8),
        workspaceId,
        assignedTo: body.assignedTo,
        taskName: body.taskName,
        status: 'Pending',
        date: body.date || new Date().toISOString().split('T')[0]
      };
      await db.insert(schema.tasks).values(newTask);
      return NextResponse.json(newTask, { status: 201 });
    }

    if (body.action === 'completeTask') {
      const [task] = await db.select().from(schema.tasks).where(and(eq(schema.tasks.id, body.taskId), eq(schema.tasks.workspaceId, workspaceId)));
      if (task) {
        await db.transaction(async (tx) => {
          await tx.update(schema.tasks).set({ status: 'Completed' }).where(and(eq(schema.tasks.id, body.taskId), eq(schema.tasks.workspaceId, workspaceId)));
          
          await tx.insert(schema.alertLogs).values({
            id: 'al' + Date.now().toString().slice(-8),
            workspaceId,
            date: new Date().toISOString().split('T')[0],
            message: `INFO: Task "${task.taskName}" completed by ${task.assignedTo}.`,
            severity: 'Info',
            read: false
          });
        });
        return NextResponse.json({ success: true, task: { ...task, status: 'Completed' } });
      }
      return NextResponse.json({ error: 'Task not found' }, { status: 440 });
    }

    // Default: Add new staff member
    const newStaff = {
      id: 's' + Date.now().toString().slice(-8),
      workspaceId,
      name: body.name,
      role: body.role,
      salary: Number(body.salary),
      attendanceDays: Number(body.attendanceDays) || 0,
      contact: body.contact || '',
      assignedBranches: body.assignedBranches || []
    };
    
    await db.transaction(async (tx) => {
      await tx.insert(schema.staff).values(newStaff);
      
      await tx.insert(schema.alertLogs).values({
        id: 'al' + Date.now().toString().slice(-8),
        workspaceId,
        date: new Date().toISOString().split('T')[0],
        message: `INFO: Added new staff member ${newStaff.name} as ${newStaff.role}.`,
        severity: 'Info',
        read: false
      });
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to manage staff operations' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.update(schema.staff).set(fields).where(and(eq(schema.staff.id, id), eq(schema.staff.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await db.delete(schema.staff).where(and(eq(schema.staff.id, id), eq(schema.staff.workspaceId, workspaceId)));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
