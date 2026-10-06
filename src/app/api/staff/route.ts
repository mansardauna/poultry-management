'use strict';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getWorkspaceId, applyWorkspaceFilter, applyStaffWorkspaceFilter } from '@/lib/workspace';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/** Exported function GET */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const workspaceId = await getWorkspaceId();
  const [staffRes, tasksRes, payrollLogsRes] = await Promise.all([
    applyStaffWorkspaceFilter(supabase.from('staff').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('tasks').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('payrollLogs').select('*'), workspaceId)
  ]);

  const normalizedStaff = (staffRes.data || []).map((s: Record<string, unknown>) => {
    let branches: string[] = [];
    if (Array.isArray(s.assignedBranches)) {
      branches = s.assignedBranches as string[];
    } else if (typeof s.assignedBranches === 'string') {
      try {
        const parsed = JSON.parse(s.assignedBranches);
        if (Array.isArray(parsed)) branches = parsed;
      } catch {}
      if (branches.length === 0 && s.assignedBranches.trim() && s.assignedBranches !== '[]') {
        branches = [s.assignedBranches.trim().replace(/[\[\]"']/g, '')];
      }
    }
    return {
      id: String(s.id),
      name: (s.name as string) || 'Staff Member',
      role: (s.role as string) || 'Attendant',
      salary: Number(s.salary) || 0,
      attendanceDays: Number(s.attendanceDays) || 0,
      contact: (s.contact as string) || '',
      assignedBranches: branches
    };
  });

  const normalizedTasks = (tasksRes.data || []).map((t: Record<string, unknown>) => ({
    id: String(t.id),
    assignedTo: (t.assignedTo as string) || 'Staff',
    taskName: (t.taskName as string) || 'Assigned Task',
    status: (t.status as string) || 'Pending',
    date: (t.date as string) || new Date().toISOString().split('T')[0]
  }));

  const normalizedPayroll = (payrollLogsRes.data || []).map((p: Record<string, unknown>) => ({
    id: String(p.id),
    date: (p.date as string) || new Date().toISOString().split('T')[0],
    staffId: String(p.staffId || ''),
    amount: Number(p.amount) || 0,
    period: (p.period as string) || ''
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
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
    const adminUsername = user?.email?.split('@')[0] || 'admin';

    // Resolve organization ID for staff
    let adminOrgId = '';
    if (user?.email) {
      try {
        const { data: adminUserRec } = await supabase.from('users').select('orgId, workspaceId').eq('email', user.email).limit(1).maybeSingle();
        if (adminUserRec?.orgId) adminOrgId = adminUserRec.orgId;
        else if (adminUserRec?.workspaceId && adminUserRec.workspaceId.includes('org_')) {
          const match = adminUserRec.workspaceId.match(/org_[a-zA-Z0-9]+/);
          if (match) adminOrgId = match[0];
        }
      } catch {}
    }
    if (!adminOrgId && workspaceId && workspaceId.includes('org_')) {
      const match = workspaceId.match(/org_[a-zA-Z0-9]+/);
      if (match) adminOrgId = match[0];
    }

    const rawBranches = (Array.isArray(body.assignedBranches) && body.assignedBranches.length > 0)
      ? body.assignedBranches
      : (workspaceId ? [workspaceId] : []);

    const assignedBranchList = rawBranches.map((b: string) => (b === 'main' ? workspaceId : b));
    const targetBranchId = assignedBranchList[0] || workspaceId;

    const staffNameStr = (typeof body.name === 'string' && body.name.trim()) ? body.name.trim() : 'Farm Attendant';
    const staffUsername = (typeof body.username === 'string' && body.username.trim()) 
      ? body.username.trim() 
      : staffNameStr.toLowerCase().replace(/\s+/g, '');
    const defaultStaffPass = crypto.randomBytes(8).toString('base64url');
    const staffPassword = (typeof body.password === 'string' && body.password.trim()) ? body.password.trim() : defaultStaffPass;
    const staffRole = body.role === 'Manager' ? 'Manager' : 'Staff';

    // Check if an onboarding staff member already exists in this workspace to update instead of duplicate
    const { data: existingStaffList } = await applyWorkspaceFilter(supabase.from('staff').select('*'), workspaceId).limit(1);
    const isExistingOnboardingMember = Boolean(existingStaffList && existingStaffList.length > 0 && body.isOnboarding);
    const currentStaffId = isExistingOnboardingMember ? existingStaffList![0].id : null;

    // Global anti-impersonation uniqueness check across ALL workspaces in both users and staff tables
    const cleanUser = staffUsername.trim().toLowerCase();
    const poultryEmail = `${cleanUser}@poultry.local`;
    const [{ data: userMatches }, { data: staffMatches }] = await Promise.all([
      supabase.from('users').select('id, username, email').or(`username.eq.${cleanUser},email.eq.${cleanUser},email.eq.${poultryEmail}`),
      supabase.from('staff').select('id, username, name').or(`username.eq.${cleanUser},name.eq.${cleanUser}`)
    ]);

    const conflictingUser = (userMatches || []).find((u: Record<string, unknown>) => !currentStaffId || (u.id !== `usr_${currentStaffId}` && u.id !== currentStaffId));
    const conflictingStaff = (staffMatches || []).find((s: Record<string, unknown>) => !currentStaffId || s.id !== currentStaffId);

    if (conflictingUser || conflictingStaff) {
      return NextResponse.json({
        error: `Staff login username "${staffUsername}" is already taken across the platform. Please choose a unique username to prevent impersonation.`
      }, { status: 409 });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(staffPassword, salt);

    if (existingStaffList && existingStaffList.length > 0 && body.isOnboarding) {
      const existing = existingStaffList[0];
      const updated = {
        workspaceId: targetBranchId,
        name: staffNameStr,
        username: staffUsername,
        password: passwordHash,
        role: body.role || existing.role || 'Staff',
        salary: Number(body.salary) || existing.salary || 45000,
        assignedBranches: assignedBranchList
      };
      await supabase.from('staff').update(updated).eq('id', existing.id);

      // Ensure user credential exists for onboarding staff
      try {
        await supabase.from('users').upsert([{
          id: `usr_${existing.id}`,
          username: staffUsername.toLowerCase(),
          email: `${staffUsername.toLowerCase()}@poultry.local`,
          passwordHash: passwordHash,
          role: staffRole,
          workspaceId: targetBranchId,
          orgId: adminOrgId || null,
          createdBy: adminUsername,
          createdAt: new Date().toISOString()
        }]);
      } catch {}

      return NextResponse.json({ ...existing, ...updated, password: passwordHash }, { status: 200 });
    }

    const newStaff = {
      id: 's' + Date.now().toString().slice(-8),
      workspaceId: targetBranchId,
      name: staffNameStr,
      username: staffUsername,
      password: passwordHash,
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
      try {
        await supabase.from('users').upsert([{
          id: `usr_${newStaff.id}`,
          username: staffUsername.toLowerCase(),
          email: `${staffUsername.toLowerCase()}@poultry.local`,
          passwordHash: passwordHash,
          role: staffRole,
          workspaceId: targetBranchId,
          orgId: adminOrgId || null,
          createdBy: adminUsername,
          createdAt: new Date().toISOString()
        }]);
      } catch {}
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
  } catch (err) {
    return NextResponse.json({ error: 'Failed to manage staff operations: ' + (err as Error).message }, { status: 500 });
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
    const _workspaceId = await getWorkspaceId();
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let type = searchParams.get('type');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
      type = body.type || type;
    }

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    if (type === 'task' || (id.startsWith('t') && !id.startsWith('s'))) {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, deleted: 'task' });
    }

    if (type === 'payroll' || id.startsWith('pay_') || id.startsWith('pl_')) {
      const { error } = await supabase.from('payrollLogs').delete().eq('id', id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, deleted: 'payroll' });
    }

    // Default: Staff member deletion
    const { data: staffMembers } = await supabase.from('staff').select('*').eq('id', id);
    const staffMember = staffMembers?.[0];

    // Delete staff record
    const { error: staffErr } = await supabase.from('staff').delete().eq('id', id);
    if (staffErr) return NextResponse.json({ error: staffErr.message }, { status: 500 });

    // Delete associated login credentials and tasks
    if (staffMember) {
      try {
        await supabase.from('users').delete().eq('id', `usr_${id}`);
      } catch (_e) {}

      const identifiers = [
        staffMember.username?.trim(),
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

      if (staffMember.name) {
        try {
          await supabase.from('tasks').delete().eq('assignedTo', staffMember.name);
        } catch (_e) {}
      }
    }

    return NextResponse.json({ success: true, deleted: 'staff' });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to delete staff: ' + ((err as { message?: string })?.message || String(err)) }, { status: 500 });
  }
}
