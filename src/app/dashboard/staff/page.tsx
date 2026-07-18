'use strict';
import { supabase } from "@/lib/supabase";
import { StaffClient } from "@/components/features/staff/StaffClient";
import type { Staff, StaffTask } from "@/data/types";
import { getAuthUser } from '@/lib/auth';
import { getWorkspaceId } from '@/lib/workspace';

/** Exported function default */
export default async function StaffPage() {
  const user = await getAuthUser();
  const role = user?.role || 'Staff';
  const workspaceId = await getWorkspaceId();

  const [staffRaw, tasksRaw] = await Promise.all([
    supabase.from('staff').select('*').eq('workspaceId', workspaceId),
    supabase.from('tasks').select('*').eq('workspaceId', workspaceId)
  ]);
  const staff = (staffRaw.data || []) as Staff[];
  const tasks = (tasksRaw.data || []) as StaffTask[];

  return (
    <StaffClient 
      initialStaff={staff} 
      initialTasks={tasks}
      role={role}
    />
  );
}
