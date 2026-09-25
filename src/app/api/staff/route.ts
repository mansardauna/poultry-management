'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId, applyWorkspaceFilter } from '@/lib/workspace';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [staffRes, tasksRes, payrollLogsRes] = await Promise.all([
    applyWorkspaceFilter(supabase.from('staff').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('tasks').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('payrollLogs').select('*'), workspaceId)
  ]);

  const normalizedStaff = (staffRes.data || []).map((s: any) => ({
    id: String(s.id),
    name: s.name || 'Staff Member',
    role: s.role || 'Attendant',
    salary: Number(s.salary) || 0,
    attendanceDays: Number(s.attendanceDays) || 0,
    contact: s.contact || '',
    assignedBranches: Array.isArray(s.assignedBranches) ? s.assignedBranches : []
  }));

  const normalizedTasks = (tasksRes.data || []).map((t: any) => ({
    id: String(t.id),
    assignedTo: t.assignedTo || 'Staff',
    taskName: t.taskName || 'Assigned Task',
    status: t.status || 'Pending',
    date: t.date || new Date().toISOString().split('T')[0]
  }));

  const normalizedPayroll = (payrollLogsRes.data || []).map((p: any) => ({
    id: String(p.id),
    date: p.date || new Date().toISOString().split('T')[0],
    staffId: String(p.staffId || ''),
    amount: Number(p.amount) || 0,
    period: p.period || ''
  }));
  
  return NextResponse.json({
    staff: normalizedStaff,
    tasks: normalizedTasks,
    payrollLogs: normalizedPayroll
  });
}

/** Exported function POST */
export async function POST(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    
    if (body.action === 'attendance') {
      const { data: members } = await supabase.from('staff').select('*').eq('id', body.staffId).eq('workspaceId', workspaceId);
      const member = members?.[0];
      if (member) {
        const updatedAttendance = (member.attendanceDays || 0) + 1;
        await supabase.from('staff').update({ attendanceDays: updatedAttendance }).eq('id', body.staffId).eq('workspaceId', workspaceId);
        return NextResponse.json({ success: true, member: { ...member, attendanceDays: updatedAttendance } });
      }
      return NextResponse.json({ error: 'Staff member not found' }, { status: 440 });
    }

    if (body.action === 'assignTask') {
      const newTask = {
        id: 't' + Date.now().toString().slice(-8),
        workspaceId,
        assignedTo: body.assignedTo || 'Staff',
        taskName: body.taskName || 'Assigned Task',
        status: 'Pending',
        date: body.date || new Date().toISOString().split('T')[0]
      };
      const { error: insErr } = await supabase.from('tasks').insert([newTask]);
      if (insErr) {
        return NextResponse.json({ error: insErr.message || 'Failed to assign task' }, { status: 500 });
      }
      return NextResponse.json(newTask, { status: 201 });
    }

    if (body.action === 'completeTask') {
      const { data: tasks } = await supabase.from('tasks').select('*').eq('id', body.taskId).eq('workspaceId', workspaceId);
      const task = tasks?.[0];
      if (task) {
        await supabase.from('tasks').update({ status: 'Completed' }).eq('id', body.taskId).eq('workspaceId', workspaceId);
        
        await supabase.from('alertLogs').insert([{
          id: 'al' + Date.now().toString().slice(-8),
          workspaceId,
          date: new Date().toISOString().split('T')[0],
          message: `INFO: Task "${task.taskName}" completed by ${task.assignedTo}.`,
          severity: 'Info',
          read: false
        }]);
        return NextResponse.json({ success: true, task: { ...task, status: 'Completed' } });
      }
      return NextResponse.json({ error: 'Task not found' }, { status: 440 });
    }

    // Default: Add new staff member
    const user = await getAuthUser();
    const adminUsername = user?.email?.split('@')[0] || 'admin';

    const assignedBranchList = (Array.isArray(body.assignedBranches) && body.assignedBranches.length > 0)
      ? body.assignedBranches
      : (workspaceId ? [workspaceId] : []);

    const staffNameStr = (typeof body.name === 'string' && body.name.trim()) ? body.name.trim() : 'Farm Attendant';
    const staffUsername = (typeof body.username === 'string' && body.username.trim()) 
      ? body.username.trim() 
      : staffNameStr.toLowerCase().replace(/\s+/g, '');
    const staffPassword = (typeof body.password === 'string' && body.password.trim()) ? body.password.trim() : 'staff123';
    const staffRole = body.role === 'Manager' ? 'Manager' : 'Staff';

    // Check if an onboarding staff member already exists in this workspace to update instead of duplicate
    const { data: existingStaffList } = await applyWorkspaceFilter(supabase.from('staff').select('*'), workspaceId).limit(1);
    if (existingStaffList && existingStaffList.length > 0 && body.isOnboarding) {
      const existing = existingStaffList[0];
      const updated = {
        workspaceId,
        name: staffNameStr,
        username: staffUsername,
        role: body.role || existing.role || 'Staff',
        salary: Number(body.salary) || existing.salary || 45000,
        assignedBranches: assignedBranchList
      };
      await supabase.from('staff').update(updated).eq('id', existing.id);
      return NextResponse.json({ ...existing, ...updated }, { status: 200 });
    }

    const newStaff = {
      id: 's' + Date.now().toString().slice(-8),
      workspaceId,
      name: staffNameStr,
      username: staffUsername,
      role: body.role || 'Staff',
      salary: Number(body.salary) || 45000,
      attendanceDays: Number(body.attendanceDays) || 0,
      contact: body.contact || '',
      assignedBranches: assignedBranchList
    };
    
    const { error: insErr } = await supabase.from('staff').insert([newStaff]);
    if (insErr) {
      return NextResponse.json({ error: insErr.message || 'Failed to add staff member' }, { status: 500 });
    }
    
    // Create user login credential in primary users table
    if (staffUsername && staffPassword) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(staffPassword, salt);

      try {
        await supabase.from('users').insert([{
          id: `usr_${Date.now()}`,
          username: staffUsername,
          passwordHash: passwordHash,
          role: staffRole,
          workspaceId: workspaceId,
          createdBy: adminUsername,
          createdAt: new Date().toISOString()
        }]);
      } catch (_e) {}
    }
    
    await supabase.from('alertLogs').insert([{
      id: 'al' + Date.now().toString().slice(-8),
      workspaceId,
      date: new Date().toISOString().split('T')[0],
      message: `INFO: Added new staff member ${newStaff.name} as ${newStaff.role}.`,
      severity: 'Info',
      read: false
    }]);

    return NextResponse.json(newStaff, { status: 201 });
  } catch (err: any) {
    console.error('Staff creation failed:', err);
    return NextResponse.json({ error: 'Failed to manage staff operations: ' + err.message }, { status: 500 });
  }
}

/** Exported function PUT */
export async function PUT(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const body = await request.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });
    await supabase.from('staff').update(fields).eq('id', id).eq('workspaceId', workspaceId);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update staff' }, { status: 500 });
  }
}

/** Exported function DELETE */
export async function DELETE(request: Request) {
  try {
    const workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const { data: staffMembers } = await supabase.from('staff').select('*').eq('id', id).eq('workspaceId', workspaceId);
    const staffMember = staffMembers?.[0];

    await supabase.from('staff').delete().eq('id', id).eq('workspaceId', workspaceId);

    if (staffMember) {
      const identifiers = [
        staffMember.name?.trim(),
        staffMember.contact?.trim()
      ].filter(Boolean);

      for (const n of identifiers) {
        if (n) {
          try {
            await supabase.from('users').delete().or(`username.eq.${n},username.eq.${n.toLowerCase()}`);
          } catch (_e) {}
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete staff error:', err);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
