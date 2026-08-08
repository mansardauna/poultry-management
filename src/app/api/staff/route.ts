'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId } from '@/lib/workspace';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/** Exported function GET */
export async function GET() {
  const workspaceId = await getWorkspaceId();
  const [staffRes, tasksRes, payrollLogsRes] = await Promise.all([
    supabase.from('staff').select('*').eq('workspaceId', workspaceId),
    supabase.from('tasks').select('*').eq('workspaceId', workspaceId),
    supabase.from('payrollLogs').select('*').eq('workspaceId', workspaceId)
  ]);
  
  return NextResponse.json({
    staff: staffRes.data || [],
    tasks: tasksRes.data || [],
    payrollLogs: payrollLogsRes.data || []
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
        assignedTo: body.assignedTo,
        taskName: body.taskName,
        status: 'Pending',
        date: body.date || new Date().toISOString().split('T')[0]
      };
      await supabase.from('tasks').insert([newTask]);
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

    const staffUsername = body.username ? body.username.trim() : body.name?.toLowerCase().replace(/\s+/g, '');

    const newStaff = {
      id: 's' + Date.now().toString().slice(-8),
      workspaceId,
      name: body.name,
      username: staffUsername,
      role: body.role || 'Staff',
      salary: Number(body.salary) || 0,
      attendanceDays: Number(body.attendanceDays) || 0,
      contact: body.contact || '',
      assignedBranches: assignedBranchList
    };
    
    await supabase.from('staff').insert([newStaff]);
    
    // Create user login credential
    if (body.username && body.password) {
      const salt = bcrypt.genSaltSync(10);
      const passwordHash = bcrypt.hashSync(body.password, salt);
      const staffRole = body.role === 'Manager' ? 'Manager' : 'Staff';
      const staffEmail = staffUsername.includes('@') ? staffUsername : `${staffUsername}@farm.local`;

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

      try {
        const { supabase: adminClient } = await import('@/lib/supabase');
        const { data: usersData } = await adminClient.auth.admin.listUsers();
        const existingAuth = usersData?.users.find(u => u.email?.toLowerCase() === staffEmail.toLowerCase());

        if (existingAuth) {
          await adminClient.auth.admin.updateUserById(existingAuth.id, {
            password: body.password,
            email_confirm: true,
            user_metadata: { role: staffRole, workspaceId: workspaceId, username: staffUsername }
          });
        } else {
          await adminClient.auth.admin.createUser({
            email: staffEmail,
            password: body.password,
            email_confirm: true,
            user_metadata: { role: staffRole, workspaceId: workspaceId, username: staffUsername }
          });
        }
      } catch (_authErr) {
        console.error('Supabase Auth sync error:', _authErr);
      }
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

    // 1. Fetch staff details before deletion to clean up auth credentials
    const { data: staffMembers } = await supabase.from('staff').select('*').eq('id', id).eq('workspaceId', workspaceId);
    const staffMember = staffMembers?.[0];

    // 2. Delete from `staff` table
    await supabase.from('staff').delete().eq('id', id).eq('workspaceId', workspaceId);

    // 3. Delete from `users` table & Supabase Auth if credentials exist
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

      // Delete from Supabase Auth
      try {
        const { supabase: adminClient } = await import('@/lib/supabase');
        const { data: usersData } = await adminClient.auth.admin.listUsers();
        
        const candidateEmails = [
          staffMember.name?.toLowerCase().replace(/\s+/g, '') + '@farm.local',
          staffMember.contact?.toLowerCase(),
          staffMember.contact?.toLowerCase() + '@farm.local',
          staffMember.name?.toLowerCase()
        ].filter(Boolean);

        const authUserToDelete = usersData?.users?.find(u => 
          candidateEmails.includes(u.email?.toLowerCase())
        );

        if (authUserToDelete) {
          await adminClient.auth.admin.deleteUser(authUserToDelete.id);
        }
      } catch (_authErr) {
        console.error('Failed to revoke Supabase Auth for deleted staff:', _authErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Delete staff error:', err);
    return NextResponse.json({ error: 'Failed to delete staff' }, { status: 500 });
  }
}
