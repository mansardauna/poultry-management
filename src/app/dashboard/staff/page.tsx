'use strict';
import { supabase } from "@/lib/supabase";
import { StaffClient } from "@/components/features/staff/StaffClient";
import type { Staff, StaffTask } from "@/data/types";
import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId, applyWorkspaceFilter, applyStaffWorkspaceFilter } from '@/lib/workspace';
import { isRouteAllowedForRole } from '@/lib/permissions';
import { AccessDenied } from '@/components/layout/AccessDenied';

/** Exported function default */
import { headers, cookies } from 'next/headers';

export default async function StaffPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';

  if (!isRouteAllowedForRole('/dashboard/staff', role)) {
    return <AccessDenied role={role} path="/dashboard/staff" />;
  }

  const workspaceId = await getWorkspaceId();
  const reqHeaders = await headers();
  const cookieStore = await cookies();
  const tier = reqHeaders.get('x-user-tier') || cookieStore.get('pfms_tier')?.value || 'free';

  const [staffRaw, tasksRaw] = await Promise.all([
    applyStaffWorkspaceFilter(supabase.from('staff').select('*'), workspaceId),
    applyWorkspaceFilter(supabase.from('tasks').select('*'), workspaceId)
  ]);
  const staff = ((staffRaw.data || []) as any[]).map((s: any) => {
    let branches: string[] = [];
    if (Array.isArray(s.assignedBranches)) {
      branches = s.assignedBranches;
    } else if (typeof s.assignedBranches === 'string') {
      try {
        const parsed = JSON.parse(s.assignedBranches);
        if (Array.isArray(parsed)) branches = parsed;
      } catch {}
      if (branches.length === 0 && s.assignedBranches.trim() && s.assignedBranches !== '[]') {
        branches = [s.assignedBranches.trim().replace(/[\[\]"']/g, '')];
      }
    }
    return { ...s, assignedBranches: branches } as Staff;
  });
  const tasks = (tasksRaw.data || []) as StaffTask[];

  return (
    <StaffClient 
      initialStaff={staff} 
      initialTasks={tasks}
      role={role}
      tier={tier}
    />
  );
}
